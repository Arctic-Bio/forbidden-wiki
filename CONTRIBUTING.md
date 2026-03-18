# Contributing to The Forbidden Wiki

Thank you for your interest in contributing to The Forbidden Wiki! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We're building a collaborative community.

## Getting Started

1. **Fork the Repository**: Click the "Fork" button on GitHub
2. **Clone Your Fork**: 
   ```bash
   git clone https://github.com/yourusername/forbidden-wiki.git
   cd forbidden-wiki
   ```
3. **Create a Branch**: 
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Set Up Development Environment** (see README.md)

## Development Workflow

### Making Changes

1. **Follow Existing Patterns**: Look at similar components/pages to match the codebase style
2. **Test Locally**: Always test your changes before submitting
3. **Keep Changes Focused**: One feature/fix per pull request
4. **Write Clear Commits**: Use descriptive commit messages

### Code Style

- **TypeScript**: Use proper typing, avoid `any`
- **Components**: Use functional components with hooks
- **Styling**: Use Tailwind CSS classes, follow existing design patterns
- **API Routes**: Follow RESTful conventions
- **Database**: Use parameterized queries to prevent SQL injection

### Testing

- Test new features locally before submitting
- Verify database migrations work correctly
- Check that auth flows work as expected
- Test on mobile and desktop viewports

## Submission Process

### Before Creating a PR

1. **Update from Main**:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Build & Test**:
   ```bash
   pnpm run build
   pnpm run dev
   ```

3. **Check for Issues**:
   - No TypeScript errors
   - No console warnings
   - All existing tests pass

### Creating a Pull Request

1. **Push Your Branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a PR on GitHub**:
   - Use a clear, descriptive title
   - Reference any related issues (e.g., "Fixes #123")
   - Describe what you changed and why

3. **PR Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation
   - [ ] Performance improvement

   ## How to Test
   Steps to test the changes

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] No new warnings generated
   - [ ] Changes tested locally
   - [ ] Related docs updated
   ```

## Types of Contributions

### Bug Reports
- **Title**: Brief description of the bug
- **Description**: Steps to reproduce, expected vs actual behavior
- **Environment**: Node version, OS, browser (if applicable)
- **Logs**: Any relevant error messages or logs

### Feature Requests
- **Title**: Brief feature description
- **Motivation**: Why is this feature needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: Any alternative approaches considered?

### Documentation
- Improvements to README
- Adding inline code comments
- Creating guides or tutorials
- Fixing typos or unclear explanations

### Code Improvements
- Performance optimizations
- Security enhancements
- Refactoring for clarity
- Database query optimizations

## Areas for Contribution

### High Priority
- Bug fixes and security issues
- Performance improvements
- Documentation
- UI/UX improvements

### Good for New Contributors
- Documentation improvements
- Adding comments to complex code
- Creating issue templates
- Adding examples

### Advanced Topics
- New major features
- Database schema changes
- Authentication improvements
- Architecture refactoring

## Review Process

When you submit a PR:

1. **Automated Checks**: GitHub Actions will run tests
2. **Code Review**: Maintainers will review your code
3. **Discussion**: Address any feedback or questions
4. **Approval**: Once approved, your PR can be merged
5. **Merge**: Maintainers will merge to main branch

## Branching Strategy

- `main` - Stable, deployable code
- `develop` - Integration branch for features (optional)
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches
- `docs/*` - Documentation branches

Example: `feature/user-profiles`, `fix/forum-sorting`, `docs/api-endpoints`

## Commit Messages

Use clear, concise commit messages:

```
feat: Add user profile page with contribution history
fix: Correct article search ranking algorithm
docs: Update installation instructions
style: Improve article editor toolbar styling
refactor: Simplify forum thread query logic
perf: Optimize media library pagination
```

## Database Changes

If your contribution involves database changes:

1. **Create a Migration**: Add a new SQL file in `scripts/`
   - Name: `002-feature-name.sql` (increment from latest)
   - Include rollback instructions in comments

2. **Document Changes**: Update README with new tables/fields

3. **Test Migration**: 
   ```bash
   # Test on local database
   psql $DATABASE_URL < scripts/002-feature-name.sql
   ```

4. **Add to Setup**: Include in `.env.example` if needed

## Questions or Need Help?

- **Open an Issue**: For bugs or feature requests
- **Start a Discussion**: For questions or suggestions
- **Check Docs**: See README.md for common questions
- **Review Code**: Look at similar features for reference

## Recognition

Contributors will be recognized in:
- README.md contributors section
- GitHub contributor graph
- Release notes (for significant contributions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to The Forbidden Wiki!** 🚀
