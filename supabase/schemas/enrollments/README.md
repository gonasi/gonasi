# Enrollment Flow Diagrams

# Free Enrollment Flow

1. User selects FREE tier
   ↓
2. Validate tier is_free = true
   ↓
3. Create/Update enrollment record
   ↓
4. Create enrollment_activity with:
   - is_free = true
   - price_paid = 0
   - access granted immediately
     ↓
5. NO payment record created
   ↓
6. Update course stats
   ↓
7. Send confirmation email
   Paid Enrollment Flow
8. User selects PAID tier
   ↓
9. Calculate effective pricing (handle promotions)
   ↓
10. Create payment intent with processor
    ↓
11. User completes payment
    ↓
12. Payment webhook received
    ↓
13. Verify payment & Create/Update enrollment
    ↓
14. Create enrollment_activity with pricing details
    ↓
15. Create payment record with transaction details
    ↓
16. Update course stats
    ↓
17. Send confirmation email
