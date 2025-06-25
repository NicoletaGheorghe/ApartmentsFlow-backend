# Development Guidelines

## 🚨 CRITICAL DEVELOPMENT RULE

**NEVER generate code from scratch using AI. ALWAYS build upon pre-existing code.**

### Why This Matters
- Maintains code consistency and architecture
- Preserves existing patterns and conventions
- Avoids conflicts with established codebase
- Ensures proper integration with existing systems

### How to Follow This Rule
1. **Always examine existing code first** - Look at similar implementations in the codebase
2. **Extend existing functions/classes** - Don't create new ones unless absolutely necessary
3. **Follow established patterns** - Use the same structure, naming conventions, and error handling
4. **Reference existing implementations** - Use them as templates for new features
5. **Modify existing code** - Rather than replacing it entirely

### Before Starting Any Task
1. Search for existing similar functionality
2. Read the relevant existing code thoroughly
3. Understand the current patterns and conventions
4. Plan modifications to existing code rather than new implementations

### Examples of Good vs Bad Approaches

❌ **BAD**: Creating a new image upload controller from scratch
✅ **GOOD**: Extending the existing apartment controller with image upload methods

❌ **BAD**: Writing a new authentication middleware
✅ **GOOD**: Modifying existing auth middleware to add new features

❌ **BAD**: Creating new route files for similar functionality
✅ **GOOD**: Adding new routes to existing route files

---

**Remember: This is a CRITICAL rule that must be followed for every code change.** 