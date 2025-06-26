# npm Publishing Steps for HarmonyCode v3.1.0

## Prerequisites
- [ ] PR merged to main branch
- [ ] You're on main branch with latest changes
- [ ] You're logged into npm (`npm login`)
- [ ] You have publish permissions for 'harmonycode' package

## Steps to Publish

1. **Ensure you're on main and up to date**:
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Build the TypeScript files**:
   ```bash
   npm run build
   ```

3. **Run tests** (if available):
   ```bash
   npm test
   ```

4. **Check what will be published**:
   ```bash
   npm pack --dry-run
   ```

5. **Publish to npm**:
   ```bash
   npm publish
   ```

6. **Create GitHub release**:
   ```bash
   git tag v3.1.0
   git push origin v3.1.0
   ```

   Then create release on GitHub with changelog notes.

## Verify Publication

1. Check npm:
   ```bash
   npm view harmonycode@3.1.0
   ```

2. Test installation:
   ```bash
   npm install -g harmonycode@3.1.0
   hc --version  # Should show 3.1.0
   ```

## Post-Publish Announcement

Consider announcing the new version:
- GitHub release notes
- Project README update
- Social media if applicable

### Key Features to Highlight:
- Persistent identity system
- Fix for identity crisis
- Atomic task locking
- Short command alias 'hc'
- Full backward compatibility