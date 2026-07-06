const SMTP_PROVIDERS = {
  gmail: { label: 'Gmail', host: 'smtp.gmail.com', port: 465, secure: true },
  outlook: { label: 'Outlook / Microsoft 365', host: 'smtp.office365.com', port: 587, secure: false },
  yahoo: { label: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 465, secure: true },
  zoho: { label: 'Zoho', host: 'smtp.zoho.com', port: 465, secure: true },
  custom: { label: 'Custom SMTP' },
};

module.exports = SMTP_PROVIDERS;
