# Corporate Ranking System

Automated transaction monitoring and ranking system for Roblox groups.

## Environment Variables Required

- `ROBLOX_COOKIE` - Bot account cookie
- `GROUP_ID` - Your group ID
- `DISCORD_WEBHOOK` - Discord webhook URL

## Installation
```bash
npm install
npm start
```

## Adding Products

Edit the `PRODUCT_CATALOG` array in `bot.js`:
```javascript
{
    id: 12345678,
    name: 'Product Name',
    type: 'GamePass',
    rank: 10,  // Optional - only for auto-ranking
    color: '#3498db'
}
```
