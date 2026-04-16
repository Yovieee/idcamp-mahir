import CONFIG from '../config';

const ENDPOINTS = {
  ENDPOINT: `${CONFIG.BASE_URL}/your/endpoint/here`,
};

export async function getData() {
  // Simulating an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, title: 'Superior MVP Architecture', description: 'Clean and maintainable code structure.' },
        { id: 2, title: 'Premium View Transitions', description: 'Smooth and modern user experience.' },
        { id: 3, title: 'Vibrant Design System', description: 'Wowed by rich aesthetics and micro-animations.' },
      ]);
    }, 500);
  });
}