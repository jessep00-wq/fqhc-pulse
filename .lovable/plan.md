## Upload files to QI Committee Packet & Board Quality Report

Same pattern as the PDSA bundle upload. Two products currently have empty `included_file_paths`, so the BuyButton shows "Coming soon." Uploading the deliverables flips them to "Buy now."

### Files → products

**QI Committee Packet Template** (`6ebf3ca5-d275-4377-b691-52eaac74773b`)
- `QI_Committee_Packet_Template.docx`
- `QI_Committee_Packet_Guide.pdf`

**Board Quality Report Template** (`222dd7b2-73a3-489c-ba9e-6fc14648e7c2`)
- `Board_Quality_Report_Template.docx`

### Steps
1. Copy the 3 uploaded files into the `product-files` Supabase storage bucket under `{product_id}/{filename}`.
2. Run a migration to set `included_file_paths` on both `store_products` rows.
3. Confirm both products now show as purchasable in `/store`.

### Reminder
The "Governance Bundle" (which includes QI Committee Packet) will also auto-unlock once its child product has files. UDS Template Pack remains the only product still without files after this.