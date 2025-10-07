# Hunt & Discovery Feature Implementation

## Overview
I've successfully implemented a fully functional Hunt & Discovery system that allows users to discover and claim LFT tokens through an interactive grid-based game.

## What Was Implemented

### 1. **Persistent Hunt Progress** (`/src/lib/storage.ts`)
- Added `HuntProgress` interface to track:
  - `revealed`: Coordinates that have been opened
  - `matched`: Coordinates that have been claimed
  - `foundTokens`: Total tokens claimed per asset
- Updated `StoredState` to include `huntProgress: Record<string, HuntProgress>`
- Progress persists across page refreshes and sessions

### 2. **App State Management** (`/src/lib/app-state.tsx`)
- Added hunt progress state to the global app context
- New actions:
  - `getHuntProgress(assetId)`: Retrieve hunt progress for an asset
  - `updateHuntProgress(assetId, progress)`: Save hunt progress
  - `claimHuntToken(assetId)`: Claim a discovered token and add it to user's wallet
- Token claiming logic:
  - Deducts from asset's available pool (`assetAvailable`)
  - Adds to user's LFT balance for that asset (`userAssets`)
  - Returns false if no tokens available

### 3. **Interactive Hunt Page** (`/src/pages/Hunt.tsx`)
- Connected to app state using the `useApp()` hook
- Loads saved progress on mount
- Auto-saves progress when coordinates are revealed/matched
- **Gameplay Flow:**
  1. User clicks boxes to reveal coordinate pairs
  2. User finds the matching coordinate in the reference table
  3. User enters the coordinate to claim the token
  4. Token is added to their wallet with real LFT value
- **Validation:**
  - Checks if coordinate exists
  - Ensures box was opened first
  - Prevents double-claiming
  - Enforces max token limit
  - Verifies tokens are available in the pool

## How It Works

### Token Discovery Flow
```
1. User opens a box → Reveals coordinate (e.g., "G12")
2. User looks up coordinate in reference table → Finds it at position G12
3. User enters "G12" → System validates
4. claimHuntToken() called → Deducts from assetAvailable[assetId]
5. Token added to userAssets[assetId].lfts → Increases user's LFT balance
6. Progress saved to localStorage → Persists across sessions
```

### State Synchronization
- Hunt progress auto-saves on every change
- When switching between assets, previous progress is loaded
- User can return to any hunt and continue where they left off
- Tokens claimed are immediately reflected in Portfolio page

## Key Features

✅ **Persistent Progress**: All hunt data saved to localStorage
✅ **Real Token Claims**: Discovered tokens add actual LFT units to user wallet
✅ **Multi-Asset Support**: Each asset has independent hunt progress
✅ **Validation**: Comprehensive checks prevent exploits
✅ **Mobile Responsive**: Fixed bottom controls for mobile devices
✅ **Visual Feedback**: Color-coded boxes (grey=hidden, white=revealed, green=claimed)
✅ **Real-time Stats**: Wallet value and token count update instantly

## Testing the Feature

1. Navigate to any asset's detail page
2. Click "Start Hunt" or go to `/hunt/:assetId`
3. Click boxes to reveal coordinate pairs
4. Find coordinates in the reference table
5. Enter coordinates to claim tokens
6. Check Portfolio page to see claimed tokens
7. Refresh page - progress should persist
8. Return to hunt - should resume from last position

## Integration Points

- **Assets Page**: Shows available LFTs per asset
- **Asset Detail Page**: Link to start hunt for that asset
- **Portfolio Page**: Displays all LFTs owned (including hunted ones)
- **Revenue Page**: LFTs from hunting can be redeemed for liquidity

## Technical Details

- Uses seeded random generation for deterministic coordinate placement
- 20x20 grid with 400 possible coordinates (A1-T20)
- 320 boxes displayed in hunt grid (subset of coordinates)
- Maximum 100 tokens per asset (or asset's initialSupply, whichever is lower)
- Tokens have real value based on asset's LPU (Liquidity Per Unit)

## Next Steps (Optional Enhancements)

- Add "Reveal All" power-up (costs CoinTags)
- Implement time-based hunt cycles
- Add leaderboards for fastest hunters
- Create special rare coordinates with bonus multipliers
- Add hunt achievements and badges
- Implement hunt tournaments with prizes
