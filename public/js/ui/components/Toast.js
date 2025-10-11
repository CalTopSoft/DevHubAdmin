export default {
    show(message, type = 'success') {
      const toast = document.createElement('div');
      toast.className = `p-4 rounded shadow-lg ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white animate-slide-in`;
      toast.textContent = message;
  
      const container = document.getElementById('toast-container');
      container.appendChild(toast);
  
      setTimeout(() => {
        toast.className = toast.className.replace('animate-slide-in', 'animate-slide-out');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  };