import { useState, useCallback } from 'react'
import { AIService, ProposalAnalysis, ProposalData } from '../services/aiService'
import toast from 'react-hot-toast'

export const useAI = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ProposalAnalysis | null>(null)

  const analyzeProposal = useCallback(async (proposal: ProposalData): Promise<ProposalAnalysis | null> => {
    setIsAnalyzing(true)
    setAnalysis(null)

    try {
      toast.loading('Analyzing proposal with AI...', { id: 'ai-analysis' })
      
      const result = await AIService.analyzeProposal(proposal)
      setAnalysis(result)
      
      toast.success('AI analysis completed!', { id: 'ai-analysis' })
      return result
    } catch (error) {
      console.error('AI analysis error:', error)
      toast.error('AI analysis failed. Using fallback analysis.', { id: 'ai-analysis' })
      
      // Still return fallback analysis
      const fallbackResult = AIService.getFallbackAnalysis(proposal)
      setAnalysis(fallbackResult)
      return fallbackResult
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const getProjectSuggestions = useCallback(async (category: string, location: string): Promise<string[]> => {
    try {
      return await AIService.getProjectSuggestions(category, location)
    } catch (error) {
      console.error('Failed to get project suggestions:', error)
      return [
        'Solar panel installation program for residential buildings',
        'Community garden and urban farming initiative',
        'Renewable energy education and training center'
      ]
    }
  }, [])

  const getCategoryInsights = useCallback(async (category: string) => {
    try {
      return await AIService.getCategoryInsights(category)
    } catch (error) {
      console.error('Failed to get category insights:', error)
      return {
        averageImpact: 70,
        commonChallenges: [
          'Regulatory approval delays',
          'Funding and resource constraints',
          'Community engagement challenges'
        ],
        successFactors: [
          'Strong community support',
          'Clear project timeline',
          'Experienced project team'
        ]
      }
    }
  }, [])

  return {
    isAnalyzing,
    analysis,
    analyzeProposal,
    getProjectSuggestions,
    getCategoryInsights
  }
}
