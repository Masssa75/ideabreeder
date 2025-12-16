# Blog Styling Handoff

## Blog File
`content/blog/homework-myth.md`

This is a ~2,000 word research-backed article about homework and elementary school children. It's the first blog post for Bamboo Valley's new website.

---

## Content Structure

The markdown file includes:

### Front Matter
```yaml
---
title: "Homework Doesn't Help Kids Under 10: 35 Years of Research"
description: "A meta-analysis of 35 studies found no benefit from homework for elementary students..."
slug: homework-myth
keywords: ["homework elementary school", "does homework help kids", ...]
author: "Bamboo Valley"
date: 2024-12-16
lastUpdated: 2024-12-16
---
```

### Content Elements to Style
1. **H1** - Main title (one per page)
2. **H2** - Section headings (several are question-format for SEO)
3. **H3** - Subsections (numbered list items like "### 1. Talk to the Teacher")
4. **Blockquotes** (`>`) - Used for:
   - Research quotes
   - Sample scripts parents can use
   - Opt-out letter template
5. **Bold text** - Key statistics and emphasis
6. **Bulleted lists** - Questions to ask teachers, etc.
7. **Horizontal rules** (`---`) - Section separators
8. **Links** - Sources section at bottom has external links
9. **Italics** - Journal names, book titles

---

## SEO Requirements (Important)

### Meta Tags (in `<head>`)
```html
<title>Homework Doesn't Help Kids Under 10: 35 Years of Research | Bamboo Valley</title>
<meta name="description" content="A meta-analysis of 35 studies found no benefit from homework for elementary students. For third graders, more homework meant lower achievement. Here's what actually works.">
<meta name="keywords" content="homework elementary school, does homework help kids, homework research, homework benefits, alternative education">
<link rel="canonical" href="https://[domain]/blog/homework-myth">
```

### Open Graph / Social Sharing
```html
<meta property="og:title" content="Homework Doesn't Help Kids Under 10: 35 Years of Research">
<meta property="og:description" content="A meta-analysis of 35 studies found no benefit from homework for elementary students...">
<meta property="og:type" content="article">
<meta property="og:url" content="https://[domain]/blog/homework-myth">
<meta property="og:image" content="[social share image if available]">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Homework Doesn't Help Kids Under 10: 35 Years of Research">
<meta name="twitter:description" content="A meta-analysis of 35 studies found no benefit...">
```

### Structured Data (Schema.org)
Consider adding Article schema for rich results:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Homework Doesn't Help Kids Under 10: 35 Years of Research",
  "author": {
    "@type": "Organization",
    "name": "Bamboo Valley"
  },
  "datePublished": "2024-12-16",
  "dateModified": "2024-12-16",
  "description": "A meta-analysis of 35 studies found no benefit from homework for elementary students...",
  "publisher": {
    "@type": "Organization",
    "name": "Bamboo Valley",
    "url": "https://[domain]"
  }
}
</script>
```

### URL Structure
- Use the `slug` from front matter: `/blog/homework-myth`
- Keep URLs short and keyword-rich
- Avoid dates in URLs (they age poorly)

### Heading Hierarchy
- Exactly ONE `<h1>` per page (the title)
- `<h2>` for main sections
- `<h3>` for subsections
- Don't skip levels (no h2 → h4)

### Page Speed Considerations
- Lazy load any images
- Minimize render-blocking CSS/JS
- Core Web Vitals matter for ranking

### Internal Linking
- Once more blog posts exist, link between related articles
- Ensure blog is accessible within 3 clicks from homepage

---

## Featured Snippet Optimization

The blog has a **featured snippet bait section** right after the title:

```markdown
## Does homework help elementary school children?

**No.** A meta-analysis of 35 studies found no relationship...
```

This is intentionally formatted for Google to extract as a featured snippet. Consider:
- Styling this section slightly differently (summary box?)
- Keeping the question as an H2 (important for snippet extraction)
- The answer paragraph is exactly 60 words (optimal for snippets)

---

## Brand / Visual Context

Based on @bamboovalleyphuket Instagram:
- **Colors:** Warm greens, earthy tones, natural palette
- **Feel:** Organic, welcoming, nature-focused
- **Avoid:** Harsh colors, overly corporate styling

### Suggested Styling Priorities
1. Clean, readable typography (article is ~2,000 words)
2. Good whitespace between sections
3. Blockquotes should stand out (used for important quotes/scripts)
4. Mobile-friendly (parents will read on phones)
5. Easy-to-scan headings (many are questions)

---

## Sources Section

The article ends with a "Sources" section containing external links. Consider:
- Smaller font size
- Links open in new tab (`target="_blank"`)
- Maybe collapsible on mobile?

---

## "Last Updated" Display

The front matter includes `lastUpdated`. Displaying this helps with:
- SEO (Google prefers fresh content)
- Trust (readers know info is current)

Suggested placement: Near the author/date, or at bottom of article.

---

## Testing Checklist

After deployment:
- [ ] Meta title shows correctly in browser tab
- [ ] Meta description appears in Google (use site:domain.com search)
- [ ] Open Graph tags work (test with Facebook Sharing Debugger)
- [ ] Twitter card works (test with Twitter Card Validator)
- [ ] All internal links work
- [ ] All external source links work and open in new tab
- [ ] Mobile rendering looks good
- [ ] Page speed is acceptable (test with PageSpeed Insights)
- [ ] Heading hierarchy is correct (H1 → H2 → H3)

---

## Files Reference

- Blog content: `content/blog/homework-myth.md`
- SEO research: `data/SEO-BLOG-BEST-PRACTICES.md`
- Education research: `data/education-research/SHOCKING-FINDINGS.md`
- Parent activities research: `data/education-research/PARENT-ACTIVITIES-RESEARCH.md`
