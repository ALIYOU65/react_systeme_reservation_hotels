import React from "react";
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-site">
      {/* Bloc centre : Contacts */}
      <div className="footer-center">
        <p><strong>01 43 98 56 43</strong></p>
        <p><strong>06 45 09 80 65</strong></p>
        <p>hotelbooking@gmail.com</p>
      </div>

      <div className="footer-container">
        {/* Bloc gauche : TikTok / Facebook */}
        <div className="footer-left">
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
            <img src="/images/logo_tik_tok.png" alt="TikTok" />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <img src="/images/icône_facebook.png" alt="Facebook" />
          </a>
        </div>

        {/* Bloc droite : Instagram / Twitter */}
        <div className="footer-right">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <img src="/images/icône_instagram.png" alt="Instagram" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
            <img src="/images/logo_twitter.jpg" alt="Twitter" />
          </a>
        </div>
      </div>

      <p className="copyright-text">
        Copyright 2025 HôtelBooking
      </p>
    </footer>
  );
};

export default Footer;
