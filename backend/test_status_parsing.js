// Test the status parsing logic
const statusString = "assigned,en_route,arrived,in_progress";
const statusArray = statusString.split(',').map(s => s.trim());

console.log('Original status string:', statusString);
console.log('Parsed status array:', statusArray);
console.log('Array length:', statusArray.length);
console.log('Individual values:');
statusArray.forEach((status, index) => {
  console.log(`  ${index}: "${status}"`);
});

// Test with actual job statuses
const jobStatuses = ['assigned', 'en_route'];
console.log('\nTesting matches:');
jobStatuses.forEach(jobStatus => {
  const matches = statusArray.includes(jobStatus);
  console.log(`Job status "${jobStatus}" matches filter: ${matches}`);
});