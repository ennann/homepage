# 简历网站视觉验收

**比较基准**

- Source visual truth: `/Users/Ethan/.codex/generated_images/01a06b88-0138-78b2-af88-e7524dfcb3b6/exec-2865cc23-f57c-412c-a16d-75200faf227e.png`
- Rendered implementation: `tmp/design-qa/resume-top.jpg`
- Independent-product focus: `tmp/design-qa/resume-products-two-column.jpg`
- Side-by-side evidence: `tmp/design-qa/source-vs-implementation.jpg`
- Viewport/state: Codex in-app browser, desktop light theme, authenticated `/resume`, 1001 × 1119 CSS px, device density 1
- Pixel dimensions: source 1435 × 1096; implementation captures 1001 × 1119; comparison canvas 2014 × 1119
- Normalization: the source was proportionally fitted into a 1001 × 1119 frame without cropping; the implementation used a native 1001 × 1119 browser capture. Browser chrome was excluded.

**Findings**

- No actionable P0, P1, or P2 findings remain.
- Typography: the implementation keeps the Chinese system-font stack ahead of Latin fonts, uses zero negative tracking, readable optical weights, and body line height around 1.8. Chinese wrapping and hierarchy remain clear at the reviewed viewport.
- Spacing and layout rhythm: the 780 px editorial column, generous section intervals, one-pixel dividers, and restrained grid preserve the selected reference's quiet personal-portfolio rhythm. The product region now uses a 320 px left image column and a flexible right copy column.
- Colors and tokens: warm paper background, near-black text, muted gray metadata, and restrained blue accent are consistent throughout; contrast remains sufficient without introducing decorative dashboard styling.
- Image quality and fidelity: all product captures use real project assets, retain their intrinsic aspect ratio, use `height: auto` and `object-fit: contain`, and are no longer cropped into a synthetic 16:9 frame. Avatar and product images remain sharp at displayed size.
- Copy and content: the page presents 一店一群、益禾堂门店 AI 质检、Agent 工程闭环 and three independent products as distinct stories with evidence-bound outcomes and clear personal attribution.

**Intentional Differences**

- Chinese body text is slightly larger and looser than the visual concept to improve long-form Chinese readability.
- The selected concept showed an independent-product image as a broad block. After explicit user review, the implementation instead uses a smaller left-image/right-content layout while preserving the original image ratio.
- Internal customer projects intentionally use text-led case studies because no suitable public source imagery is available; no placeholder or fabricated visual was introduced.

**Comparison History**

1. Initial comparison found product images visually dominant and cropped to 16:9, a P2 hierarchy and asset-fidelity issue.
2. Fix: removed fixed-ratio cropping, added intrinsic image dimensions, changed images to `height: auto` with `object-fit: contain`, and rebuilt the product section as a 320 px / flexible two-column layout.
3. Post-fix evidence: `tmp/design-qa/resume-products-two-column.jpg` shows all three product images smaller, uncropped, and aligned left of their corresponding content. No new overflow, distortion, or hierarchy regression is visible.

**Open Questions**

- None blocking. The mobile breakpoint is implemented as a single-column stack and code-reviewed; the final desktop visual is the primary HR interview surface requested in this iteration.

**Implementation Checklist**

- [x] Preserve original image proportions
- [x] Reduce product-image prominence
- [x] Use left image / right content on desktop
- [x] Stack cleanly on narrow screens
- [x] Keep PDF styling and web styling visually coherent
- [x] Verify the final static build

**Follow-up Polish**

- P3: if a future project has public-safe photography or diagrams, add one real source image to each enterprise case study; do not use decorative placeholders.

final result: passed
