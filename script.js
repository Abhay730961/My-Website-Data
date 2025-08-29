const form = document.getElementById('contact-form');
const statusMessage = document.getElementById('status-message');

form.addEventListener('submit', async (event) => {
  event.preventDefault(); // पेज को रीलोड होने से रोकें

  // फॉर्म से डेटा लें
  const formData = {
    name: form.name.value,
    email: form.email.value,
    message: form.message.value,
  };

  statusMessage.textContent = 'Sending...';

  try {
    // हमारे Vercel Serverless Function को कॉल करें
    const response = await fetch('/api/submit-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      statusMessage.textContent = 'Thank you! Your message has been sent.';
      form.reset(); // फॉर्म को खाली कर दें
    } else {
      throw new Error('Something went wrong.');
    }
  } catch (error) {
    statusMessage.textContent = 'Oops! There was a problem submitting your form.';
    console.error('Error:', error);
  }
});