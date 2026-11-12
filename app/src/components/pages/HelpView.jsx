export default function HelpView({ onNavigate }) {
  return (
    <section className="view-container fade-in help-page">
      <header className="help-header">
        <p className="about-section-badge">SETTLEIN SUPPORT</p>
        <h1 className="about-section-title">How can we help?</h1>
        <p className="about-section-sub">Quick answers for finding a home and managing your account.</p>
      </header>

      <div className="help-questions">
        <details>
          <summary>How do I find a property?</summary>
          <p>Browse verified listings, then filter by campus, room type, rent, or search term. Sign in to view full property details.</p>
        </details>
        <details>
          <summary>How do I request a reservation?</summary>
          <p>Open a listing, choose a move-in date and lease duration, and submit your request. It stays pending until an administrator reviews it.</p>
        </details>
        <details>
          <summary>Where can I check my reservation status?</summary>
          <p>Sign in and open My reservations. Your status refreshes automatically; an administrator approves, rejects, or cancels requests.</p>
        </details>
        <details>
          <summary>I forgot my password. How do I regain access?</summary>
          <p>Contact a SettleIn administrator and ask them to reset your account from the Users section of the admin panel. For security, an administrator must verify your identity first.</p>
        </details>
        <details>
          <summary>How can I submit a property?</summary>
          <p>Choose List your property, sign in, and submit the property details. Listings are not visible publicly until an administrator verifies them.</p>
        </details>
        <details>
          <summary>Are online payments enabled?</summary>
          <p>No. The system can display recorded payment entries, but it does not collect money or connect to a payment provider.</p>
        </details>
      </div>

      <div className="help-actions">
        <button className="about-cta-primary" onClick={() => onNavigate('listings')}>Browse properties</button>
        <button className="about-cta-secondary" onClick={() => onNavigate('contact')}>Contact support</button>
      </div>
    </section>
  );
}
