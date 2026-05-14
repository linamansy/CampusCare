async function test() {
  try {
    const response = await fetch('http://localhost:3000/api/issues');
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Success:', data.success);
    if (data.success) {
      console.log('Issue count:', data.count);
    } else {
      console.log('Error:', data);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
