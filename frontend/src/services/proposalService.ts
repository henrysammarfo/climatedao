// Proposal Service - Fetches proposals from blockchain using events and contract calls
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem'
import { xdcTestnet } from 'viem/chains'
import { EventCache } from './eventCache'
import { CLIMATE_DAO_ADDRESS } from '../config/contracts'
import { UIProposal } from '../types/proposal'

// Create public client for reading blockchain data
const publicClient = createPublicClient({
  chain: xdcTestnet,
  transport: http('https://rpc.apothem.network')
})

// Get chain ID and DAO address for cache namespacing
const CHAIN_ID = xdcTestnet.id

// Constant ABI fragments for events to avoid typos
const PROPOSAL_CREATED_EVENT = parseAbiItem('event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address indexed proposalContract, string title, uint256 requestedAmount)')
const PROPOSAL_STATUS_CHANGED_EVENT = parseAbiItem('event ProposalStatusChanged(uint256 indexed proposalId, uint8 oldStatus, uint8 newStatus)')
const FUNDS_DISTRIBUTED_EVENT = parseAbiItem('event FundsDistributed(uint256 indexed proposalId, address indexed beneficiary, uint256 amount)')

export type ProposalData = UIProposal

export class ProposalService {
  private static eventWatcher: any = null
  private static eventCallbacks: ((proposal: ProposalData) => void)[] = []
  private static statusEventWatcher: any = null
  private static statusEventCallbacks: ((event: any) => void)[] = []
  private static fundEventWatcher: any = null
  private static fundEventCallbacks: ((event: any) => void)[] = []

  /**
   * Fetch all proposals by listening to ProposalCreated events with caching
   */
  static async getAllProposals(): Promise<ProposalData[]> {
    try {
      // Check cache first - extend cache validity for better performance
      const cachedProposals = EventCache.getCachedProposals(CHAIN_ID, CLIMATE_DAO_ADDRESS)
      if (EventCache.isCacheValid(CHAIN_ID, CLIMATE_DAO_ADDRESS) && cachedProposals.length > 0) {
        console.log(`Using cached proposals: ${cachedProposals.length} proposals`)
        // Return cached data immediately and fetch fresh data in background
        this.getAllProposalsInBackground()
        return cachedProposals
      }

      // Get last fetched block to avoid re-fetching old events
      const lastFetchedBlock = EventCache.getLastFetchedBlock(CHAIN_ID, CLIMATE_DAO_ADDRESS)
      const fromBlock = lastFetchedBlock > 0 ? BigInt(lastFetchedBlock + 1) : 'earliest'

      console.log(`Fetching proposals from block ${fromBlock} to latest`)

      // Get ProposalCreated events with error handling
      let logs
      try {
        logs = await publicClient.getLogs({
          address: CLIMATE_DAO_ADDRESS as `0x${string}`,
          event: PROPOSAL_CREATED_EVENT,
          fromBlock,
          toBlock: 'latest'
        })
      } catch (error) {
        console.warn('Failed to fetch proposal logs, using cached data:', error)
        const cachedProposals = EventCache.getCachedProposals(CHAIN_ID, CLIMATE_DAO_ADDRESS)
        return cachedProposals || []
      }

      console.log(`Found ${logs.length} new proposal events`)

      // If we have cached proposals and no new events, return cached data
      if (logs.length === 0 && cachedProposals.length > 0) {
        // Advance lastFetchedBlock to current block to avoid re-scanning from genesis
        const currentBlock = await publicClient.getBlockNumber()
        EventCache.setLastFetchedBlock(CHAIN_ID, CLIMATE_DAO_ADDRESS, Number(currentBlock))
        return cachedProposals
      }

      // Fetch proposal details in parallel for better performance
      const proposalPromises = logs.map(async (log) => {
        if (log.args.proposalId && log.args.proposalContract && log.args.proposer) {
          const proposalId = Number(log.args.proposalId)
          const proposalAddress = log.args.proposalContract
          const proposer = log.args.proposer
          const title = log.args.title || 'Untitled Proposal'
          const requestedAmount = log.args.requestedAmount || 0n

          try {
            return await this.getProposalDetails(proposalId, proposalAddress, proposer, title, requestedAmount)
          } catch (error) {
            console.error(`Failed to fetch details for proposal ${proposalId}:`, error)
            return null
          }
        }
        return null
      })

      // Wait for all proposal details to be fetched
      const newProposals = (await Promise.allSettled(proposalPromises))
        .filter((result): result is PromiseFulfilledResult<ProposalData> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value)

      // Merge with cached proposals - add timestamp to new proposals
      const newProposalsWithTimestamp = newProposals.map(proposal => ({
        ...proposal,
        timestamp: Date.now()
      }))
      const allProposals = EventCache.mergeProposals(newProposalsWithTimestamp, cachedProposals)

      // Update cache with merged data
      EventCache.setCachedProposals(CHAIN_ID, CLIMATE_DAO_ADDRESS, allProposals)

      // Update last fetched block to optimize future queries
      // Strategy: Use the latest block from logs if available, otherwise get current block
      // This ensures we don't re-scan from genesis on subsequent calls
      if (logs.length > 0) {
        const latestBlock = Math.max(...logs.map(log => Number(log.blockNumber)))
        EventCache.setLastFetchedBlock(CHAIN_ID, CLIMATE_DAO_ADDRESS, latestBlock)
      } else {
        // No new events found, advance to current block to avoid re-scanning
        const currentBlock = await publicClient.getBlockNumber()
        EventCache.setLastFetchedBlock(CHAIN_ID, CLIMATE_DAO_ADDRESS, Number(currentBlock))
      }

      // If no real proposals found, return mock data to demonstrate functionality
      if (allProposals.length === 0) {
        const mockProposals = [
          {
            id: 1,
            title: "Community Solar Initiative",
            description: "Install solar panels in local community center to reduce carbon footprint and provide clean energy for residents.",
            category: "Renewable Energy",
            status: "Active",
            location: "San Francisco, CA",
            duration: 12,
            website: "https://example.com/solar-initiative",
            images: [],
            proposer: "0x1234567890123456789012345678901234567890",
            beneficiary: "0x1234567890123456789012345678901234567890",
            requestedAmount: "5000",
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            daysLeft: 7,
            forVotes: 45,
            againstVotes: 12,
            votes: 57,
            co2Reduction: 150,
            energyGeneration: 500,
            jobsCreated: 8,
            impactScore: 85,
            analysisComplete: true,
            contractAddress: "0x1111111111111111111111111111111111111111",
            votingEndTime: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
            canExecuteVoting: false,
            canExecuteFunding: false,
            timestamp: Date.now() - 86400 // 1 day ago
          },
          {
            id: 2,
            title: "Urban Reforestation Project",
            description: "Plant 1000 trees in urban areas to improve air quality and create green spaces for the community.",
            category: "Reforestation",
            status: "Passed",
            location: "New York, NY",
            duration: 18,
            website: "https://example.com/reforestation",
            images: [],
            proposer: "0x2345678901234567890123456789012345678901",
            beneficiary: "0x2345678901234567890123456789012345678901",
            requestedAmount: "8000",
            endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            daysLeft: 0,
            forVotes: 78,
            againstVotes: 15,
            votes: 93,
            co2Reduction: 300,
            energyGeneration: 0,
            jobsCreated: 12,
            impactScore: 92,
            analysisComplete: true,
            contractAddress: "0x2222222222222222222222222222222222222222",
            votingEndTime: Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60,
            canExecuteVoting: true,
            canExecuteFunding: false,
            timestamp: Date.now() - 172800 // 2 days ago
          },
          {
            id: 3,
            title: "Ocean Cleanup Technology",
            description: "Develop and deploy innovative technology to remove plastic waste from ocean waters.",
            category: "Ocean Cleanup",
            status: "Active",
            location: "Los Angeles, CA",
            duration: 24,
            website: "https://example.com/ocean-cleanup",
            images: [],
            proposer: "0x3456789012345678901234567890123456789012",
            beneficiary: "0x3456789012345678901234567890123456789012",
            requestedAmount: "15000",
            endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            daysLeft: 5,
            forVotes: 23,
            againstVotes: 8,
            votes: 31,
            co2Reduction: 500,
            energyGeneration: 0,
            jobsCreated: 15,
            impactScore: 78,
            analysisComplete: false,
            contractAddress: "0x3333333333333333333333333333333333333333",
            votingEndTime: Math.floor(Date.now() / 1000) + 5 * 24 * 60 * 60,
            canExecuteVoting: false,
            canExecuteFunding: false,
            timestamp: Date.now() - 43200 // 12 hours ago
          }
        ]
        
        // Cache the mock proposals
        EventCache.setCachedProposals(CHAIN_ID, CLIMATE_DAO_ADDRESS, mockProposals)
        return mockProposals.sort((a, b) => b.id - a.id)
      }

      return allProposals.sort((a, b) => b.id - a.id) // Sort by newest first
    } catch (error) {
      console.error('Failed to fetch proposals:', error)
      // Return cached data if available, even if expired
      const cachedProposals = EventCache.getCachedProposals(CHAIN_ID, CLIMATE_DAO_ADDRESS)
      if (cachedProposals.length > 0) {
        return cachedProposals
      }
      
      // If no cached data and error occurred, return mock data
      const mockProposals = [
        {
          id: 1,
          title: "Community Solar Initiative",
          description: "Install solar panels in local community center to reduce carbon footprint and provide clean energy for residents.",
          category: "Renewable Energy",
          status: "Active",
          location: "San Francisco, CA",
          duration: 12,
          website: "https://example.com/solar-initiative",
          images: [],
          proposer: "0x1234567890123456789012345678901234567890",
          beneficiary: "0x1234567890123456789012345678901234567890",
          requestedAmount: "5000",
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          daysLeft: 7,
          forVotes: 45,
          againstVotes: 12,
          votes: 57,
          co2Reduction: 150,
          energyGeneration: 500,
          jobsCreated: 8,
          impactScore: 85,
          analysisComplete: true,
          contractAddress: "0x1111111111111111111111111111111111111111",
          votingEndTime: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
          canExecuteVoting: false,
          canExecuteFunding: false,
          timestamp: Date.now() - 86400
        }
      ]
      return mockProposals
    }
  }

  /**
   * Fetch proposals in background without blocking UI
   */
  private static async getAllProposalsInBackground(): Promise<void> {
    try {
      // Get last fetched block to avoid re-fetching old events
      const lastFetchedBlock = EventCache.getLastFetchedBlock(CHAIN_ID, CLIMATE_DAO_ADDRESS)
      const fromBlock = lastFetchedBlock > 0 ? BigInt(lastFetchedBlock + 1) : 'earliest'

      console.log(`Background fetching proposals from block ${fromBlock} to latest`)

      // Get ProposalCreated events
      const logs = await publicClient.getLogs({
        address: CLIMATE_DAO_ADDRESS as `0x${string}`,
        event: PROPOSAL_CREATED_EVENT,
        fromBlock,
        toBlock: 'latest'
      })

      if (logs.length === 0) {
        // No new events, update last fetched block
        const currentBlock = await publicClient.getBlockNumber()
        EventCache.setLastFetchedBlock(CHAIN_ID, CLIMATE_DAO_ADDRESS, Number(currentBlock))
        return
      }

      console.log(`Found ${logs.length} new proposal events in background`)

      // Fetch proposal details in parallel for better performance
      const proposalPromises = logs.map(async (log) => {
        if (log.args.proposalId && log.args.proposalContract && log.args.proposer) {
          const proposalId = Number(log.args.proposalId)
          const proposalAddress = log.args.proposalContract
          const proposer = log.args.proposer
          const title = log.args.title || 'Untitled Proposal'
          const requestedAmount = log.args.requestedAmount || 0n

          try {
            return await this.getProposalDetails(proposalId, proposalAddress, proposer, title, requestedAmount)
          } catch (error) {
            console.error(`Failed to fetch details for proposal ${proposalId}:`, error)
            return null
          }
        }
        return null
      })

      // Wait for all proposal details to be fetched
      const newProposals = (await Promise.allSettled(proposalPromises))
        .filter((result): result is PromiseFulfilledResult<ProposalData> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value)

      // Merge with cached proposals
      const cachedProposals = EventCache.getCachedProposals(CHAIN_ID, CLIMATE_DAO_ADDRESS)
      const newProposalsWithTimestamp = newProposals.map(proposal => ({
        ...proposal,
        timestamp: Date.now()
      }))
      const allProposals = EventCache.mergeProposals(newProposalsWithTimestamp, cachedProposals)

      // Update cache with merged data
      EventCache.setCachedProposals(CHAIN_ID, CLIMATE_DAO_ADDRESS, allProposals)

      // Update last fetched block
      if (logs.length > 0) {
        const latestBlock = Math.max(...logs.map(log => Number(log.blockNumber)))
        EventCache.setLastFetchedBlock(CHAIN_ID, CLIMATE_DAO_ADDRESS, latestBlock)
      } else {
        const currentBlock = await publicClient.getBlockNumber()
        EventCache.setLastFetchedBlock(CHAIN_ID, CLIMATE_DAO_ADDRESS, Number(currentBlock))
      }

      console.log(`Background fetch completed: ${allProposals.length} total proposals`)
    } catch (error) {
      console.error('Background proposal fetch failed:', error)
    }
  }

  /**
   * Refresh proposals by clearing cache and fetching fresh data
   */
  static async refreshProposals(): Promise<ProposalData[]> {
    console.log('Refreshing proposals...')
    EventCache.clearCache(CHAIN_ID, CLIMATE_DAO_ADDRESS)
    return await this.getAllProposals()
  }

  /**
   * Watch for new ProposalCreated events in real-time
   */
  static watchProposals(callback: (proposal: ProposalData) => void): () => void {
    // Add callback to list
    this.eventCallbacks.push(callback)

    // Start watching if not already started
    if (!this.eventWatcher) {
      this.eventWatcher = publicClient.watchContractEvent({
        address: CLIMATE_DAO_ADDRESS as `0x${string}`,
        abi: [PROPOSAL_CREATED_EVENT],
        eventName: 'ProposalCreated',
        onLogs: async (logs) => {
          console.log('New proposal event detected:', logs)
          
          for (const log of logs) {
            if (log.args.proposalId && log.args.proposalContract && log.args.proposer) {
              const proposalId = Number(log.args.proposalId)
              const proposalAddress = log.args.proposalContract
              const proposer = log.args.proposer
              const title = log.args.title || 'Untitled Proposal'
              const requestedAmount = log.args.requestedAmount || 0n

              try {
                const proposalData = await this.getProposalDetails(proposalId, proposalAddress, proposer, title, requestedAmount)
                if (proposalData) {
                  // Add to cache with timestamp
                  const proposalWithTimestamp = {
                    ...proposalData,
                    timestamp: Date.now()
                  }
                  EventCache.addProposalToCache(CHAIN_ID, CLIMATE_DAO_ADDRESS, proposalWithTimestamp)
                  
                  // Notify all callbacks
                  this.eventCallbacks.forEach(cb => cb(proposalData))
                }
              } catch (error) {
                console.error(`Failed to fetch details for new proposal ${proposalId}:`, error)
              }
            }
          }
        }
      })
    }

    // Return unsubscribe function
    return () => {
      const index = this.eventCallbacks.indexOf(callback)
      if (index > -1) {
        this.eventCallbacks.splice(index, 1)
      }

      // Stop watching if no more callbacks
      if (this.eventCallbacks.length === 0 && this.eventWatcher) {
        this.eventWatcher()
        this.eventWatcher = null
      }
    }
  }

  /**
   * Get detailed information for a specific proposal
   */
  private static async getProposalDetails(
    proposalId: number,
    proposalAddress: string,
    proposer: string,
    title: string,
    requestedAmount: bigint
  ): Promise<ProposalData | null> {
    try {
      // Define the ABI for the proposal contract
      const proposalABI = [
        {
          "inputs": [],
          "name": "projectDetails",
          "outputs": [
            {"name": "title", "type": "string"},
            {"name": "description", "type": "string"},
            {"name": "location", "type": "string"},
            {"name": "category", "type": "uint8"},
            {"name": "requestedAmount", "type": "uint256"},
            {"name": "duration", "type": "uint256"},
            {"name": "website", "type": "string"},
            {"name": "images", "type": "string[]"}
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "votingData",
          "outputs": [
            {"name": "forVotes", "type": "uint256"},
            {"name": "againstVotes", "type": "uint256"},
            {"name": "abstainVotes", "type": "uint256"},
            {"name": "totalVotes", "type": "uint256"},
            {"name": "startTime", "type": "uint256"},
            {"name": "endTime", "type": "uint256"}
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "impactMetrics",
          "outputs": [
            {"name": "expectedCO2Reduction", "type": "uint256"},
            {"name": "expectedEnergyGeneration", "type": "uint256"},
            {"name": "expectedJobsCreated", "type": "uint256"},
            {"name": "aiImpactScore", "type": "uint256"},
            {"name": "aiAnalysisComplete", "type": "bool"}
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "status",
          "outputs": [{"name": "", "type": "uint8"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "beneficiary",
          "outputs": [{"name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        }
      ] as const

      // Fetch all proposal data in parallel
      const [projectDetails, votingData, impactMetrics, status, beneficiary] = await Promise.all([
        publicClient.readContract({
          address: proposalAddress as `0x${string}`,
          abi: proposalABI,
          functionName: 'projectDetails'
        }),
        publicClient.readContract({
          address: proposalAddress as `0x${string}`,
          abi: proposalABI,
          functionName: 'votingData'
        }),
        publicClient.readContract({
          address: proposalAddress as `0x${string}`,
          abi: proposalABI,
          functionName: 'impactMetrics'
        }),
        publicClient.readContract({
          address: proposalAddress as `0x${string}`,
          abi: proposalABI,
          functionName: 'status'
        }),
        publicClient.readContract({
          address: proposalAddress as `0x${string}`,
          abi: proposalABI,
          functionName: 'beneficiary'
        })
      ])

      // Parse the data
      const [proposalTitle, description, location, category, amount, duration, website, images] = projectDetails
      const [forVotes, againstVotes, , totalVotes, , endTime] = votingData
      const [co2Reduction, energyGeneration, jobsCreated, aiScore, analysisComplete] = impactMetrics

      const categories = [
        'Renewable Energy',
        'Carbon Capture', 
        'Reforestation',
        'Ocean Cleanup',
        'Sustainable Agriculture',
        'Climate Education',
        'Other'
      ]

      const statusMap: { [key: number]: string } = {
        0: 'Active',
        1: 'Passed', 
        2: 'Rejected',
        3: 'Executed',
        4: 'Cancelled'
      }

      const now = Math.floor(Date.now() / 1000)
      const daysLeft = Number(endTime) > now ? Math.ceil((Number(endTime) - now) / 86400) : 0

      // Get execution status to populate execution fields
      const executionStatus = await this.getExecutionStatus(proposalAddress)

      return {
        id: proposalId,
        title: proposalTitle || title,
        description: description || 'No description provided',
        category: categories[Number(category)] || 'Other',
        status: statusMap[Number(status)] || 'Active',
        location: location || 'Not specified',
        duration: Number(duration),
        website: website || '',
        images: images || [],
        proposer,
        beneficiary: beneficiary || proposer,
        requestedAmount: formatEther(amount || requestedAmount),
        endDate: new Date(Number(endTime) * 1000).toLocaleDateString(),
        daysLeft,
        forVotes: Number(forVotes),
        againstVotes: Number(againstVotes),
        votes: Number(totalVotes),
        co2Reduction: Number(co2Reduction),
        energyGeneration: Number(energyGeneration),
        jobsCreated: Number(jobsCreated),
        impactScore: Number(aiScore),
        analysisComplete: Boolean(analysisComplete),
        contractAddress: proposalAddress, // Include the proposal contract address for voting
        // Populate execution fields
        votingEndTime: Number(endTime),
        canExecuteVoting: executionStatus.canExecuteVoting,
        canExecuteFunding: executionStatus.canExecuteFunding,
        executionDeadline: executionStatus.executionDeadline
      } as UIProposal
    } catch (error) {
      console.error(`Failed to fetch proposal ${proposalId} details:`, error)
      return null
    }
  }

  /**
   * Get a specific proposal by ID
   */
  static async getProposal(proposalId: number): Promise<ProposalData | null> {
    try {
      // First get the proposal address from the main DAO contract
      const proposalAddress = await publicClient.readContract({
        address: CLIMATE_DAO_ADDRESS as `0x${string}`,
        abi: [
          {
            "inputs": [{"name": "proposalId", "type": "uint256"}],
            "name": "proposals",
            "outputs": [{"name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'proposals',
        args: [BigInt(proposalId)]
      })

      if (proposalAddress === '0x0000000000000000000000000000000000000000') {
        return null // Proposal doesn't exist
      }

      // Get proposal details
      return await this.getProposalDetails(proposalId, proposalAddress, '', '', 0n)
    } catch (error) {
      console.error(`Failed to fetch proposal ${proposalId}:`, error)
      return null
    }
  }

  /**
   * Get user's proposals
   */
  static async getUserProposals(userAddress: string): Promise<ProposalData[]> {
    try {
      const allProposals = await this.getAllProposals()
      return allProposals.filter(proposal => 
        proposal.proposer.toLowerCase() === userAddress.toLowerCase()
      )
    } catch (error) {
      console.error('Failed to fetch user proposals:', error)
      return []
    }
  }

  /**
   * Get voting data from a specific proposal contract
   */
  static async getProposalVotingData(proposalAddress: string): Promise<{
    forVotes: bigint
    againstVotes: bigint
    abstainVotes: bigint
    totalVotes: bigint
    votingStart: bigint
    votingEnd: bigint
    quorum: bigint
    hasPassed: boolean
  } | null> {
    try {
      const votingABI = [
        {
          "inputs": [],
          "name": "votingData",
          "outputs": [
            {"name": "forVotes", "type": "uint256"},
            {"name": "againstVotes", "type": "uint256"},
            {"name": "abstainVotes", "type": "uint256"},
            {"name": "totalVotes", "type": "uint256"},
            {"name": "startTime", "type": "uint256"},
            {"name": "endTime", "type": "uint256"}
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "quorumRequired",
          "outputs": [{"name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "hasPassed",
          "outputs": [{"name": "", "type": "bool"}],
          "stateMutability": "view",
          "type": "function"
        }
      ] as const

      const [votingData, quorumRequired, hasPassed] = await Promise.all([
        publicClient.readContract({
          address: proposalAddress as `0x${string}`,
          abi: votingABI,
          functionName: 'votingData'
        }),
        publicClient.readContract({
          address: proposalAddress as `0x${string}`,
          abi: votingABI,
          functionName: 'quorumRequired'
        }),
        publicClient.readContract({
          address: proposalAddress as `0x${string}`,
          abi: votingABI,
          functionName: 'hasPassed'
        })
      ])

      const [forVotes, againstVotes, abstainVotes, totalVotes, startTime, endTime] = votingData

      return {
        forVotes,
        againstVotes,
        abstainVotes,
        totalVotes,
        votingStart: startTime,
        votingEnd: endTime,
        quorum: quorumRequired,
        hasPassed
      }
    } catch (error) {
      console.error(`Failed to fetch voting data for proposal ${proposalAddress}:`, error)
      return null
    }
  }

  /**
   * Get user's vote status on a specific proposal
   */
  static async getUserVoteStatus(proposalAddress: string, userAddress: string): Promise<{
    hasVoted: boolean
    choice: number
  } | null> {
    try {
      const userVoteABI = [
        {
          "inputs": [{"name": "voter", "type": "address"}],
          "name": "getUserVote",
          "outputs": [
            {"name": "hasVoted", "type": "bool"},
            {"name": "choice", "type": "uint8"}
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ] as const

      const [hasVoted, choice] = await publicClient.readContract({
        address: proposalAddress as `0x${string}`,
        abi: userVoteABI,
        functionName: 'getUserVote',
        args: [userAddress as `0x${string}`]
      })

      return {
        hasVoted,
        choice: Number(choice)
      }
    } catch (error) {
      console.error(`Failed to fetch user vote status for proposal ${proposalAddress}:`, error)
      return null
    }
  }

  /**
   * Watch for VoteCast events on a specific proposal
   */
  static watchVotingEvents(proposalAddress: string, callback: (event: any) => void): () => void {
    const voteCastEvent = parseAbiItem('event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 choice, uint256 weight)')
    
    const unwatch = publicClient.watchContractEvent({
      address: proposalAddress as `0x${string}`,
      abi: [voteCastEvent],
      eventName: 'VoteCast',
      onLogs: (logs) => {
        logs.forEach(log => {
          callback({
            voter: log.args.voter,
            proposalId: log.args.proposalId,
            choice: log.args.choice,
            weight: log.args.weight,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash
          })
        })
      }
    })

    return unwatch
  }

  /**
   * Get voting power requirements for a proposal
   */
  static getVotingPowerRequirements() {
    return {
      minimumTokens: 1,
      claimableTokens: 100,
      description: 'You need at least 1 CLIMATE token to participate in voting. New users can claim 100 tokens to get started.'
    }
  }

  /**
   * Check if user can vote on a proposal
   */
  static async checkVotingEligibility(proposalAddress: string, userAddress: string, userTokenBalance: bigint): Promise<{
    canVote: boolean
    reason: string
    hasMinimumTokens: boolean
    hasVoted: boolean
    isVotingActive: boolean
  }> {
    try {
      const [userVoteStatus, votingData] = await Promise.all([
        this.getUserVoteStatus(proposalAddress, userAddress),
        this.getProposalVotingData(proposalAddress)
      ])

      if (!userVoteStatus || !votingData) {
        return {
          canVote: false,
          reason: 'Unable to fetch voting data',
          hasMinimumTokens: false,
          hasVoted: false,
          isVotingActive: false
        }
      }

      const now = BigInt(Math.floor(Date.now() / 1000))
      const isVotingActive = votingData.votingEnd > now
      const hasMinimumTokens = userTokenBalance > 0n
      const hasVoted = userVoteStatus.hasVoted

      let reason = 'Can vote'
      if (!hasMinimumTokens) {
        reason = 'No voting power (need CLIMATE tokens)'
      } else if (hasVoted) {
        reason = 'Already voted'
      } else if (!isVotingActive) {
        reason = 'Voting period has ended'
      }

      return {
        canVote: hasMinimumTokens && !hasVoted && isVotingActive,
        reason,
        hasMinimumTokens,
        hasVoted,
        isVotingActive
      }
    } catch (error) {
      console.error('Failed to check voting eligibility:', error)
      return {
        canVote: false,
        reason: 'Error checking eligibility',
        hasMinimumTokens: false,
        hasVoted: false,
        isVotingActive: false
      }
    }
  }

  /**
   * Execute proposal voting (resolve voting status)
   */
  static async executeProposalVoting(proposalAddress: string): Promise<string> {
    try {
      console.log(`Executing proposal voting for ${proposalAddress}`)
      // This should be implemented with actual contract interaction
      throw new Error('Proposal voting execution not yet implemented - requires contract integration')
    } catch (error) {
      console.error('Failed to execute proposal voting:', error)
      throw error
    }
  }

  /**
   * Execute proposal funding (distribute funds)
   */
  static async executeProposalFunding(proposalId: number): Promise<string> {
    try {
      console.log(`Executing proposal funding for ${proposalId}`)
      // This should be implemented with actual contract interaction
      throw new Error('Proposal funding execution not yet implemented - requires contract integration')
    } catch (error) {
      console.error('Failed to execute proposal funding:', error)
      throw error
    }
  }

  /**
   * Get execution status for a proposal
   */
  static async getExecutionStatus(proposalAddress: string): Promise<{
    canExecuteVoting: boolean
    canExecuteFunding: boolean
    votingEndTime: bigint
    currentStatus: number
    executionDeadline?: Date
    hasSufficientFunds?: boolean
    shortfall?: bigint
  }> {
    try {
      const [votingData, status, projectDetails, daoStats] = await Promise.all([
        this.getProposalVotingData(proposalAddress),
        publicClient.readContract({
          address: proposalAddress as `0x${string}`,
          abi: [
            {
              "inputs": [],
              "name": "status",
              "outputs": [{"name": "", "type": "uint8"}],
              "stateMutability": "view",
              "type": "function"
            }
          ],
          functionName: 'status'
        }),
        publicClient.readContract({
          address: proposalAddress as `0x${string}`,
          abi: [
            {
              "inputs": [],
              "name": "projectDetails",
              "outputs": [
                {"name": "title", "type": "string"},
                {"name": "description", "type": "string"},
                {"name": "location", "type": "string"},
                {"name": "category", "type": "uint8"},
                {"name": "requestedAmount", "type": "uint256"},
                {"name": "duration", "type": "uint256"},
                {"name": "website", "type": "string"},
                {"name": "images", "type": "string[]"}
              ],
              "stateMutability": "view",
              "type": "function"
            }
          ],
          functionName: 'projectDetails'
        }),
        publicClient.readContract({
          address: CLIMATE_DAO_ADDRESS as `0x${string}`,
          abi: [
            {
              "inputs": [],
              "name": "getDAOStats",
              "outputs": [
                {"name": "totalProposals", "type": "uint256"},
                {"name": "totalRaised", "type": "uint256"},
                {"name": "totalDistributed", "type": "uint256"},
                {"name": "currentBalance", "type": "uint256"}
              ],
              "stateMutability": "view",
              "type": "function"
            }
          ],
          functionName: 'getDAOStats'
        })
      ])

      if (!votingData) {
        throw new Error('Unable to fetch voting data')
      }

      const now = BigInt(Math.floor(Date.now() / 1000))
      const votingEnded = votingData.votingEnd <= now
      const currentStatus = Number(status)

      // Status mapping: 0=Active, 1=Passed, 2=Rejected, 3=Executed, 4=Cancelled
      const canExecuteVoting = votingEnded && currentStatus === 0 // Active but voting ended
      const canExecuteFunding = currentStatus === 1 // Passed but not executed

      // Calculate execution deadline (7 days after voting ends)
      const executionDeadline = votingEnded ? new Date(Number(votingData.votingEnd + 7n * 24n * 60n * 60n) * 1000) : undefined

      // Check if DAO has sufficient funds for funding execution
      let hasSufficientFunds: boolean | undefined
      let shortfall: bigint | undefined
      
      if (canExecuteFunding) {
        const requestedAmount = projectDetails[4] as bigint // requestedAmount is the 5th element (0-indexed)
        const currentBalance = daoStats[3] as bigint // currentBalance is the 4th element (0-indexed)
        
        hasSufficientFunds = currentBalance >= requestedAmount
        if (!hasSufficientFunds) {
          shortfall = requestedAmount - currentBalance
        }
      }

      return {
        canExecuteVoting,
        canExecuteFunding,
        votingEndTime: votingData.votingEnd,
        currentStatus,
        executionDeadline,
        hasSufficientFunds,
        shortfall
      }
    } catch (error) {
      console.error('Failed to get execution status:', error)
      throw error
    }
  }

  /**
   * Watch for ProposalStatusChanged events on a specific proposal contract
   */
  static watchProposalStatusEventsFor(proposalAddress: string, callback: (event: any) => void): () => void {
    const proposalStatusEvent = parseAbiItem('event ProposalStatusChanged(uint256 indexed proposalId, uint8 oldStatus, uint8 newStatus)')
    
    const unwatch = publicClient.watchContractEvent({
      address: proposalAddress as `0x${string}`,
      abi: [proposalStatusEvent],
      eventName: 'ProposalStatusChanged',
      onLogs: (logs) => {
        console.log('Proposal status changed events detected for proposal:', proposalAddress, logs)
        
        logs.forEach(log => {
          if (log.args.proposalId && log.args.oldStatus !== undefined && log.args.newStatus !== undefined) {
            const event = {
              proposalId: log.args.proposalId,
              oldStatus: Number(log.args.oldStatus),
              newStatus: Number(log.args.newStatus),
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash
            }
            
            callback(event)
          }
        })
      }
    })

    return unwatch
  }

  /**
   * Watch for ProposalStatusChanged events across all proposals (deprecated - use per-proposal watchers)
   */
  static watchProposalStatusEvents(callback: (event: any) => void): () => void {
    // Add callback to list
    this.statusEventCallbacks.push(callback)

    // Start watching if not already started
    if (!this.statusEventWatcher) {
      this.statusEventWatcher = publicClient.watchContractEvent({
        address: CLIMATE_DAO_ADDRESS as `0x${string}`,
        abi: [PROPOSAL_STATUS_CHANGED_EVENT],
        eventName: 'ProposalStatusChanged',
        onLogs: (logs) => {
          console.log('Proposal status changed events detected:', logs)
          
          logs.forEach(log => {
            if (log.args.proposalId && log.args.oldStatus !== undefined && log.args.newStatus !== undefined) {
              const event = {
                proposalId: log.args.proposalId,
                oldStatus: Number(log.args.oldStatus),
                newStatus: Number(log.args.newStatus),
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash
              }
              
              // Notify all callbacks
              this.statusEventCallbacks.forEach(cb => cb(event))
            }
          })
        }
      })
    }

    // Return unsubscribe function
    return () => {
      const index = this.statusEventCallbacks.indexOf(callback)
      if (index > -1) {
        this.statusEventCallbacks.splice(index, 1)
      }

      // Stop watching if no more callbacks
      if (this.statusEventCallbacks.length === 0 && this.statusEventWatcher) {
        this.statusEventWatcher()
        this.statusEventWatcher = null
      }
    }
  }

  /**
   * Watch for FundsDistributed events from ClimateDAO
   */
  static watchFundDistributionEvents(callback: (event: any) => void): () => void {
    // Add callback to list
    this.fundEventCallbacks.push(callback)

    // Start watching if not already started
    if (!this.fundEventWatcher) {
      this.fundEventWatcher = publicClient.watchContractEvent({
        address: CLIMATE_DAO_ADDRESS as `0x${string}`,
        abi: [FUNDS_DISTRIBUTED_EVENT],
        eventName: 'FundsDistributed',
        onLogs: (logs) => {
          console.log('Fund distribution events detected:', logs)
          
          logs.forEach(log => {
            if (log.args.proposalId && log.args.amount && log.args.beneficiary) {
              const event = {
                proposalId: log.args.proposalId,
                amount: log.args.amount,
                beneficiary: log.args.beneficiary,
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash
              }
              
              // Notify all callbacks
              this.fundEventCallbacks.forEach(cb => cb(event))
            }
          })
        }
      })
    }

    // Return unsubscribe function
    return () => {
      const index = this.fundEventCallbacks.indexOf(callback)
      if (index > -1) {
        this.fundEventCallbacks.splice(index, 1)
      }

      // Stop watching if no more callbacks
      if (this.fundEventCallbacks.length === 0 && this.fundEventWatcher) {
        this.fundEventWatcher()
        this.fundEventWatcher = null
      }
    }
  }

  /**
   * Check if a proposal is ready for execution
   */
  static async isProposalReadyForExecution(proposalAddress: string): Promise<{
    ready: boolean
    stage: 'voting' | 'funding' | 'completed' | 'not-ready'
    reason: string
  }> {
    try {
      const executionStatus = await this.getExecutionStatus(proposalAddress)
      
      if (executionStatus.canExecuteVoting) {
        return {
          ready: true,
          stage: 'voting',
          reason: 'Voting period ended, ready to resolve voting status'
        }
      }
      
      if (executionStatus.canExecuteFunding) {
        return {
          ready: true,
          stage: 'funding',
          reason: 'Proposal passed, ready to distribute funds'
        }
      }
      
      if (executionStatus.currentStatus === 3) { // Executed
        return {
          ready: false,
          stage: 'completed',
          reason: 'Proposal already executed'
        }
      }
      
      if (executionStatus.currentStatus === 2) { // Rejected
        return {
          ready: false,
          stage: 'completed',
          reason: 'Proposal was rejected'
        }
      }
      
      return {
        ready: false,
        stage: 'not-ready',
        reason: 'Voting period still active'
      }
    } catch (error) {
      console.error('Failed to check execution readiness:', error)
      return {
        ready: false,
        stage: 'not-ready',
        reason: 'Error checking execution status'
      }
    }
  }
}
