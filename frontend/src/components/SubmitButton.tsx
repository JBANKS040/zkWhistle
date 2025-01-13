interface SubmitButtonProps {
  onClick: () => void
  isLoading?: boolean
}

export function SubmitButton({ onClick, isLoading }: SubmitButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        px-4 py-2 rounded-lg
        ${isLoading 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-blue-500 hover:bg-blue-600'}
        text-white font-medium
      `}
    >
      {isLoading ? 'Submitting...' : 'Submit Proof'}
    </button>
  )
} 