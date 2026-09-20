// Main client script
document.addEventListener('DOMContentLoaded', () => {
  // Auto dismiss flash alerts after 6 seconds
  const alerts = document.querySelectorAll('.alert-dismissible');
  alerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alert);
      if (bsAlert) {
        bsAlert.close();
      }
    }, 6000);
  });
});
