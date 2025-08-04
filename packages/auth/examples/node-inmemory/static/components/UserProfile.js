class UserProfile {
  constructor(element) {
    this.element = element;
    this.button = this.element.querySelector(`#${element.id}-button`);
    this.popup = this.element.querySelector(`#${element.id}-popup`);
    this.isOpen = false;
    
    this.init();
  }

  init() {
    if (!this.button || !this.popup) return;

    // Handle button click
    this.button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePopup();
    });

    // Handle clicks outside the popup
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.element.contains(e.target)) {
        this.closePopup();
      }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closePopup();
      }
    });

    // Prevent popup clicks from closing the popup
    this.popup.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Handle logout form submission
    const logoutForm = this.popup.querySelector('form[action="/auth/logout"]');
    if (logoutForm) {
      logoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }
  }

  togglePopup() {
    if (this.isOpen) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  openPopup() {
    this.popup.classList.remove('hidden');
    this.button.setAttribute('aria-expanded', 'true');
    this.isOpen = true;

    // Focus management for accessibility
    const firstFocusable = this.popup.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  closePopup() {
    this.popup.classList.add('hidden');
    this.button.setAttribute('aria-expanded', 'false');
    this.isOpen = false;
    this.button.focus();
  }

  async handleLogout() {
    try {
      const response = await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear any client-side cache and redirect
        window.location.replace('/login');
      } else {
        console.error('Logout failed');
        // Fallback: still redirect to login
        window.location.replace('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: still redirect to login
      window.location.replace('/login');
    }
  }
}

// Auto-initialize when the script loads
document.querySelectorAll('[id*="user-profile"]').forEach(element => {
  if (!element.hasAttribute('data-userprofile-initialized')) {
    new UserProfile(element);
    element.setAttribute('data-userprofile-initialized', 'true');
  }
});