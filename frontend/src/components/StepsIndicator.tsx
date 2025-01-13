import { HStack, Box, Text } from '@chakra-ui/react'
import { CheckIcon } from '@chakra-ui/icons'

type Step = 'initial' | 'jwt' | 'proving' | 'proved' | 'submitting'

interface StepsIndicatorProps {
  currentStep: Step
}

export function StepsIndicator({ currentStep }: StepsIndicatorProps) {
  const steps = [
    { id: 'jwt', label: 'JWT Generation' },
    { id: 'proving', label: 'Proof Generation' },
    { id: 'proved', label: 'Proof Complete' },
    { id: 'submitting', label: 'Submit to Contract' }
  ]

  const getStepStatus = (stepId: string) => {
    const stepOrder = ['initial', 'jwt', 'proving', 'proved', 'submitting']
    const currentIndex = stepOrder.indexOf(currentStep)
    const stepIndex = stepOrder.indexOf(stepId)
    
    if (stepIndex < currentIndex) return 'complete'
    if (stepIndex === currentIndex) return 'current'
    return 'pending'
  }

  return (
    <HStack spacing={4} width="100%" justify="space-between">
      {steps.map((step) => {
        const status = getStepStatus(step.id)
        return (
          <Box key={step.id} textAlign="center">
            <Box
              w="8"
              h="8"
              borderRadius="full"
              bg={status === 'complete' ? 'green.500' : status === 'current' ? 'blue.500' : 'gray.200'}
              display="flex"
              alignItems="center"
              justifyContent="center"
              mb={2}
            >
              {status === 'complete' && <CheckIcon color="white" />}
            </Box>
            <Text fontSize="sm" color={status === 'pending' ? 'gray.500' : 'black'}>
              {step.label}
            </Text>
          </Box>
        )
      })}
    </HStack>
  )
} 