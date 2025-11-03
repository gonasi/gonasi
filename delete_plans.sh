#!/bin/bash

# ============================================================
# Delete All Paystack Plans (with pagination)
# ============================================================
# WARNING: This will delete ALL plans from your Paystack account
# Use with extreme caution!
# ============================================================

# Set your Paystack secret key here
PAYSTACK_SECRET_KEY="sk_test_d190317eccb2b7606544e501dc77306ffc18fb30"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Paystack Plans Deletion Script${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Check if secret key is set
if [ "$PAYSTACK_SECRET_KEY" = "sk_test_your_secret_key_here" ]; then
    echo -e "${RED}ERROR: Please set your PAYSTACK_SECRET_KEY in the script${NC}"
    exit 1
fi

# Check if jq is installed
if ! command -v jq > /dev/null 2>&1; then
    echo -e "${RED}ERROR: jq is not installed${NC}"
    echo "Install it with: brew install jq (Mac) or sudo apt-get install jq (Linux)"
    exit 1
fi

echo -e "${YELLOW}Testing API connection...${NC}"

# Test API call
TEST_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "https://api.paystack.co/plan?perPage=1&page=1" \
    -H "Authorization: Bearer ${PAYSTACK_SECRET_KEY}" \
    -H "Content-Type: application/json")

HTTP_CODE=$(echo "$TEST_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$TEST_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}ERROR: API call failed with HTTP code: $HTTP_CODE${NC}"
    echo -e "${RED}Response: $RESPONSE_BODY${NC}"
    echo ""
    echo "Common issues:"
    echo "- Invalid or expired secret key"
    echo "- Wrong API endpoint"
    echo "- Network connectivity issues"
    exit 1
fi

echo -e "${GREEN}✓ API connection successful${NC}"
echo ""

# Create temporary file for storing all plans
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

echo "[]" > "$TEMP_FILE"

# Fetch all plans with pagination
page=1
per_page=100
total_fetched=0

echo -e "${YELLOW}Fetching all plans...${NC}"

while true; do
    echo -e "${BLUE}Fetching page $page...${NC}"
    
    RESPONSE=$(curl -s -X GET "https://api.paystack.co/plan?perPage=$per_page&page=$page" \
        -H "Authorization: Bearer ${PAYSTACK_SECRET_KEY}" \
        -H "Content-Type: application/json")
    
    # Validate JSON
    if ! echo "$RESPONSE" | jq empty > /dev/null 2>&1; then
        echo -e "${RED}ERROR: Invalid JSON response${NC}"
        echo "$RESPONSE"
        exit 1
    fi
    
    # Check status
    status=$(echo "$RESPONSE" | jq -r '.status')
    if [ "$status" != "true" ]; then
        echo -e "${RED}ERROR: API returned error${NC}"
        echo "$RESPONSE" | jq '.'
        exit 1
    fi
    
    # Get page count
    page_count=$(echo "$RESPONSE" | jq '.data | length')
    echo -e "${GREEN}Found $page_count plans on page $page${NC}"
    
    # Append to temp file
    current_plans=$(cat "$TEMP_FILE")
    page_plans=$(echo "$RESPONSE" | jq '.data')
    echo "$current_plans" "$page_plans" | jq -s 'add' > "$TEMP_FILE"
    
    total_fetched=$((total_fetched + page_count))
    
    # Check if we should continue
    if [ "$page_count" -lt "$per_page" ]; then
        break
    fi
    
    page=$((page + 1))
    sleep 0.3
done

echo ""
echo -e "${GREEN}Total plans found: $total_fetched${NC}"
echo ""

if [ "$total_fetched" -eq 0 ]; then
    echo -e "${YELLOW}No plans to delete${NC}"
    exit 0
fi

# Display all plans
echo -e "${YELLOW}Plans to be deleted:${NC}"
cat "$TEMP_FILE" | jq -r '.[] | "- \(.name) (Code: \(.plan_code), \(.interval), \(.amount/100) \(.currency))"'
echo ""

# Confirmation
echo -e "${RED}WARNING: This will DELETE ALL $total_fetched plans!${NC}"
echo -e "${RED}This action cannot be undone (plans will be archived)!${NC}"
printf "Type 'DELETE' to confirm: "
read CONFIRM

if [ "$CONFIRM" != "DELETE" ]; then
    echo -e "${YELLOW}Deletion cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting deletion...${NC}"
echo ""

# Delete plans
success_count=0
failed_count=0
current=0

# Read plan codes into variable
plan_codes=$(cat "$TEMP_FILE" | jq -r '.[].plan_code')

for plan_code in $plan_codes; do
    current=$((current + 1))
    plan_name=$(cat "$TEMP_FILE" | jq -r ".[] | select(.plan_code==\"$plan_code\") | .name")
    
    printf "[$current/$total_fetched] Deleting: ${YELLOW}%s${NC} (${BLUE}%s${NC})\n" "$plan_name" "$plan_code"
    
    DELETE_RESPONSE=$(curl -s -X DELETE "https://api.paystack.co/plan/$plan_code" \
        -H "Authorization: Bearer ${PAYSTACK_SECRET_KEY}" \
        -H "Content-Type: application/json")
    
    # Validate JSON
    if ! echo "$DELETE_RESPONSE" | jq empty > /dev/null 2>&1; then
        echo -e "${RED}✗ Invalid response${NC}"
        failed_count=$((failed_count + 1))
        continue
    fi
    
    delete_status=$(echo "$DELETE_RESPONSE" | jq -r '.status')
    
    if [ "$delete_status" = "true" ]; then
        echo -e "${GREEN}✓ Deleted successfully${NC}"
        success_count=$((success_count + 1))
    else
        error_msg=$(echo "$DELETE_RESPONSE" | jq -r '.message')
        echo -e "${RED}✗ Failed: $error_msg${NC}"
        failed_count=$((failed_count + 1))
    fi
    
    echo ""
    sleep 0.5
done

# Summary
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}DELETION SUMMARY${NC}"
echo -e "${YELLOW}========================================${NC}"
echo "Total plans processed: $total_fetched"
echo -e "${GREEN}Successfully deleted: $success_count${NC}"
if [ "$failed_count" -gt 0 ]; then
    echo -e "${RED}Failed to delete: $failed_count${NC}"
fi
echo -e "${YELLOW}========================================${NC}"

if [ "$success_count" -eq "$total_fetched" ]; then
    echo -e "${GREEN}✓ All plans deleted successfully!${NC}"
else
    echo -e "${YELLOW}⚠ Some plans failed to delete${NC}"
fi