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
      toast.loading('Connecting to AI service...', { id: 'ai-analysis' })
      
      const result = await AIService.analyzeProposal(proposal)
      setAnalysis(result)
      
      toast.success('AI analysis completed successfully!', { id: 'ai-analysis' })
      return result
    } catch (error) {
      console.error('AI analysis error:', error)
      const errorMessage = error instanceof Error ? error.message : 'AI analysis failed'
      toast.error(errorMessage, { id: 'ai-analysis', duration: 5000 })
      
      // No fallback - let the error bubble up to the UI
      setAnalysis(null)
      throw error
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const getProjectSuggestions = useCallback(async (category: string, location: string): Promise<string[]> => {
    try {
      return await AIService.getProjectSuggestions(category, location)
    } catch (error) {
      console.error('Failed to get project suggestions:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI suggestions'
      toast.error(errorMessage, { duration: 4000 })
      throw error // No fallback suggestions
    }
  }, [])

  const getCategoryInsights = useCallback(async (category: string) => {
    try {
      return await AIService.getCategoryInsights(category)
    } catch (error) {
      console.error('Failed to get category insights:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI insights'
      toast.error(errorMessage, { duration: 4000 })
      throw error // No fallback insights
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
