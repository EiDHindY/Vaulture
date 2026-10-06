# Privacy Policy for Vaulture

**Last Updated:** October 2026

## Overview
Vaulture is an offline-first password manager. We believe your data belongs strictly to you.

## Data Storage & Encryption
All passwords and sensitive data are encrypted locally on your device using industry-standard encryption (SQLCipher/AES-256). The master password used to encrypt your data is never transmitted to us or any third-party servers.

## Google Drive Integration
If you opt-in to the Cloud Backup feature, Vaulture requests access to your Google Drive (`https://www.googleapis.com/auth/drive.file`). 
- **What we access:** Vaulture only has access to the specific folder and backup file it creates (`Vaulture Backups/vault.db`). It cannot read or modify any of your other personal Google Drive files.
- **Data sharing:** Your encrypted database is synced directly from your device to your personal Google Drive. We do not intercept, route, or store this data on any external servers.
- **Revoking access:** You can revoke Google Drive access at any time from your Google Account settings.

## Contact
If you have any questions about this privacy policy, please open an issue on the Vaulture GitHub repository.
