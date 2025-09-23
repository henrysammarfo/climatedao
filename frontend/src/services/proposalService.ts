// Proposal Service - Fetches proposals from blockchain using events and contract calls
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem'
import { xdcTestnet } from 'viem/chains'

const CLIMATE_DAO_ADDRESS = (import.meta as any).env?.VITE_CLIMATE_DAO_ADDRESS || '0xfD2CFC86e06c54d1ffe9B503391d91452a8Fd02D'

// Create public client for reading blockchain data
const publicClient = createPublicClient({
  chain: xdcTestnet,
  transport: http('https://rpc.apothem.network')
})

export interface ProposalData {
  id: number
  title: string
  description: string
  category: string
  status: string
  location: string
  duration: number
  website: string
  proposer: string
  beneficiary: string
  requestedAmount: string
  endDate: string
  daysLeft: number
  forVotes: number
  againstVotes: number
  votes: number
  co2Reduction: number
  energyGeneration: number
  jobsCreated: number
  impactScore: number
  analysisComplete: boolean
}

export class ProposalService {
  /**
   * Fetch all proposals by listening to ProposalCreated events
   */
  static async getAllProposals(): Promise<ProposalData[]> {
    try {
      // Get ProposalCreated events
      const logs = await publicClient.getLogs({
        address: CLIMATE_DAO_ADDRESS as `0x${string}`,
        event: parseAbiItem('event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address indexed proposalContract, string title, uint256 requestedAmount)'),
        fromBlock: 'earliest',
        toBlock: 'latest'
      })

      const proposals: ProposalData[] = []

      for (const log of logs) {
        if (log.args.proposalId && log.args.proposalContract && log.args.proposer) {
          const proposalId = Number(log.args.proposalId)
          const proposalAddress = log.args.proposalContract
          const proposer = log.args.proposer
          const title = log.args.title || 'Untitled Proposal'
          const requestedAmount = log.args.requestedAmount || 0n

          try {
            // Fetch proposal details from the individual proposal contract
            const proposalData = await this.getProposalDetails(proposalId, proposalAddress, proposer, title, requestedAmount)
            if (proposalData) {
              proposals.push(proposalData)
            }
          } catch (error) {
            console.error(`Failed to fetch details for proposal ${proposalId}:`, error)
          }
        }
      }

      return proposals.sort((a, b) => b.id - a.id) // Sort by newest first
    } catch (error) {
      console.error('Failed to fetch proposals:', error)
      return []
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
            {"name": "website", "type": "string"}
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
      const [proposalTitle, description, location, category, amount, duration, website] = projectDetails
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

      return {
        id: proposalId,
        title: proposalTitle || title,
        description: description || 'No description provided',
        category: categories[Number(category)] || 'Other',
        status: statusMap[Number(status)] || 'Active',
        location: location || 'Not specified',
        duration: Number(duration),
        website: website || '',
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
        analysisComplete: Boolean(analysisComplete)
      }
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
}
