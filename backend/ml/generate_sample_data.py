"""
Realistic Credit Risk & Loan Approval Dataset Generator
Solves Real-World Problem: Automated Underwriting & Risk Mitigation
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)
n = 2500

# 1. Generate Base Demographics
age = np.random.randint(18, 75, n)
employment_years = np.clip(age - 18 - np.random.randint(0, 5, n), 0, 40)
education = np.random.choice(['High School', 'Bachelor', 'Master', 'PhD'], n, p=[0.4, 0.4, 0.15, 0.05])
marital_status = np.random.choice(['Single', 'Married', 'Divorced'], n, p=[0.4, 0.45, 0.15])

# 2. Correlated Financials (Real-World Logic)
# Income grows with age and education
base_inc = 30000
edu_mult = {'High School': 1.0, 'Bachelor': 1.5, 'Master': 2.0, 'PhD': 2.5}
income = base_inc * np.array([edu_mult[e] for e in education]) + (employment_years * 1500) + np.random.normal(0, 10000, n)
income = np.clip(income, 20000, 250000).astype(int)

# Debt to Income Ratio (DTI) - realistically between 10% and 60%
debt_ratio = np.clip(np.random.normal(0.35, 0.15, n), 0.05, 0.85)

# Credit Score strongly influenced by DTI and age
credit_score = 800 - (debt_ratio * 300) + (age * 1.5) + np.random.normal(0, 50, n)
credit_score = np.clip(credit_score, 300, 850).astype(int)

# Loan variables
loan_amount = np.random.randint(5000, 150000, n)
loan_purpose = np.random.choice(['Home', 'Auto', 'Business', 'Personal', 'Education'], n)

df = pd.DataFrame({
    'age': age,
    'income': income,
    'credit_score': credit_score,
    'loan_amount': loan_amount,
    'loan_purpose': loan_purpose,
    'employment_years': employment_years,
    'debt_ratio': np.round(debt_ratio, 2),
    'num_credit_lines': np.random.randint(1, 15, n),
    'marital_status': marital_status,
    'education': education,
})

# 3. Real-world Business Risk Rules (The "Real Problem")
# Let's create an underwriting function
def underwrite(row):
    # Auto-reject triggers (High Risk)
    if row['credit_score'] < 580: return 'Rejected'
    if row['debt_ratio'] > 0.55: return 'Rejected'
    if row['income'] < 25000: return 'Rejected'
    
    # Auto-approve triggers (Low Risk)
    if row['credit_score'] > 750 and row['debt_ratio'] < 0.3: return 'Approved'
    if row['income'] > 120000 and row['debt_ratio'] < 0.4: return 'Approved'
    
    # Borderline calculations
    score = 0
    if row['employment_years'] >= 5: score += 1
    if row['loan_amount'] < (row['income'] * 0.5): score += 2
    if row['loan_amount'] >= (row['income'] * 1.0): score -= 2
    if row['education'] in ['Master', 'PhD']: score += 1
    
    return 'Approved' if score >= 1 else 'Rejected'

# Apply real underwriting rules
df['loan_approved'] = df.apply(underwrite, axis=1)

# Introduce some statistical noise (human overrides, exceptions)
noise_idx = np.random.choice(n, size=int(n*0.05), replace=False)
df.loc[noise_idx, 'loan_approved'] = np.random.choice(['Approved', 'Rejected'], len(noise_idx))

out_path = os.path.join(os.path.dirname(__file__), '..', 'sample_loan_data.csv')
df.to_csv(out_path, index=False)

print(f"✅ REALISTIC Credit Risk Dataset generated: {out_path}")
print(f"   Shape: {df.shape}")
print(f"   Target distribution:\n{df['loan_approved'].value_counts()}")
print("   -> Built using strict mathematical correlations to solve institutional underwriting problems.")
