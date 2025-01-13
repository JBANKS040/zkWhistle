export function getTimeAndExpiry() {
  const current_time = Math.floor(Date.now() / 1000);
  const jwt_exp = current_time + (60 * 60); // 1 hour
  const proof_exp = current_time + (24 * 60 * 60); // 24 hours
  
  return {
    current_time,
    jwt_exp,
    proof_exp
  };
} 