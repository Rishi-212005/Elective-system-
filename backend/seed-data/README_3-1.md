# 3-1 (5th sem) – 200 students seed + CSV

## Order of operations

1. **Upload the two CSVs** (Admin Dashboard → CSV Upload):
   - **Semester slot:** 3-1, **Department:** Computer Science → upload `cse_3-1_official.csv`
   - **Semester slot:** 3-1, **Department:** Electronics → upload `ece_3-1_official.csv`

2. **Run the seed** (from `backend` folder):
   ```bash
   npm run seed:200-31
   ```
   This creates 200 users + profiles + submitted preferences (roll numbers CSE210001–CSE210100, ECE210001–ECE210100).

3. **Run CGPA verification** (Admin → CGPA Verification):
   - Select **3-1** and **Computer Science** → Verify CGPA (100 CSE: 10 flagged, 90 matched).
   - Select **3-1** and **Electronics** → Verify CGPA (100 ECE: 10 flagged, 90 matched).

4. **Run allocation** (Admin → Allocation) so only verified 3-1 students are allocated.

## Edge cases in this seed

- **20 flagged (wrong CGPA):** CSE210001–CSE210010, ECE210001–ECE210010 have entered CGPA = official + 0.6.
- **75 students** have CS402 as first choice (elective exceeds 70 capacity).
- **Login:** username = roll number (e.g. CSE210001), password = `student123`.
