The target site's structure changed and the scraper needs healing.

Collector ID: {{collector_id}}
URL: {{url}}
Triggered by: {{triggered_by}}
Changed field(s): {{changed_fields}}
Old block hash: {{old_hash}}
New block hash: {{new_hash}}

Here is the new HTML for the affected block:
```html
{{new_block_html}}
```

Do the following, in order, stopping if any step fails:
1. Run `npx -p @brightdata/cli bdata scraper heal {{collector_id}} "<describe what changed based on the diff above>"` anchored on {{url}}.
2. Show the approval envelope (preview_result).
3. Do NOT approve yet — write the preview_result to heal/last_preview.json and exit. A separate validation step decides whether to approve.
