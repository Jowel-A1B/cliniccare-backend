# Test Accounts

All accounts (existing + newly seeded) use the same password: **password123**

Created by `seed/seedMore.js` — additive only, doesn't touch existing data.
Re-run any time (`node seed/seedMore.js` from `backend/`) — it skips accounts
that already exist, so it's safe to run again.

## Admins (one branch each, same hospital brand)
| Email | Branch | City |
|---|---|---|
| admin@clinic.com | ABC Hospital - Dinajpur | Dinajpur |
| admin2@clinic.com | ABC Hospital - Dhaka | Dhaka |

Same clinic brand (ABC Hospital), two branches, two separate branch admins —
good for testing that one branch admin can't see/manage the other branch's
data (appointments, inventory, beds, staff, expenses, invoices, insurance
claims, ambulance fleet, OT).

## Doctors
| Email | Name | Specialization | Branch | Fee | Peak-hour fee |
|---|---|---|---|---|---|
| doctor1@clinic.com | Dr. Hasan | Cardiologist | ABC Hospital - Dinajpur | 800 | — |
| doctor2@clinic.com | Dr. Rahman | Orthopedic | ABC Hospital - Dinajpur | 1000 | — |
| doctor3@clinic.com | Dr. Nusrat Jahan | Neurologist | ABC Hospital - Dinajpur | 900 | 1200 |
| doctor4@clinic.com | Dr. Kamal Hossain | Cardiologist | ABC Hospital - Dhaka | 1200 | 1500 |
| doctor5@clinic.com | Dr. Farhana Akter | Orthopedic | ABC Hospital - Dhaka | 800 | — |
| doctor6@clinic.com | Dr. Shamim Reza | Dentist | ABC Hospital - Dinajpur | 500 | 700 |
| doctor7@clinic.com | Dr. Tania Sultana | ENT | ABC Hospital - Dhaka | 700 | — |
| doctor8@clinic.com | Dr. Mahbubur Rahman | Gynecologist | ABC Hospital - Dinajpur | 1000 | 1300 |
| doctor9@clinic.com | Dr. Rummana Chowdhury | Gynecologist | ABC Hospital - Dhaka | 950 | — |
| doctor10@clinic.com | Dr. Imran Kabir | Dermatologist | ABC Hospital - Dinajpur | 650 | 850 |
| doctor11@clinic.com | Dr. Sadia Islam | Cardiologist | ABC Hospital - Dinajpur | 1100 | — |
| doctor12@clinic.com | Dr. Zahidul Islam | Orthopedic | ABC Hospital - Dinajpur | 750 | 950 |

Doctors with a peak-hour fee let you test V4 dynamic pricing — book a slot
at 17:00 or later and the invoice/`feeCharged` should use that fee instead.
Two doctors share a specialization in a couple of cases (Cardiologist,
Orthopedic, Gynecologist) so you can test search/filter sorting and
comparing doctors side by side.

## Patients
| Email | Name | Age | City |
|---|---|---|---|
| patient@clinic.com | Rahim Ahmed | 45 | Dinajpur |
| patient2@clinic.com | Fatema Begum | 34 | Dhaka |
| patient3@clinic.com | Abdul Karim | 58 | Dhaka |
| patient4@clinic.com | Nasrin Sultana | 27 | Rajshahi |
| patient5@clinic.com | Jahangir Alam | 41 | Dinajpur |
| patient6@clinic.com | Rina Akter | 22 | Dhaka |
| patient7@clinic.com | Shahidul Islam | 65 | Bogura |
| patient8@clinic.com | Mousumi Rahman | 30 | Panchagarh |
| patient9@clinic.com | Rafiqul Islam | 48 | Dhaka |

## Suggested things to test with this roster
- **Booking across clinics/cities** — book with a Dhaka doctor vs a Dinajpur
  doctor, filter search by city.
- **Doctor leave + substitute suggestion** — put doctor11 (Cardiologist,
  ABC Hospital) on leave, book with doctor1 or doctor11's slot and confirm
  doctor1 (same specialization, same clinic) is suggested.
- **Cross-branch access control** — log in as admin2 (Dhaka branch), confirm
  you can't see or act on admin1's (Dinajpur branch) appointments, inventory,
  beds, staff, expenses, or insurance claims (and vice versa). This is
  exactly what the IDOR fixes from the last review are meant to enforce.
- **Dynamic pricing** — book doctor3/4/6/8/10/12 after 17:00 and confirm the
  fee charged matches their peak-hour fee, not the base fee.
- **Reviews/ratings** — complete visits with a few different patients against
  the same doctor (e.g. doctor1) and check the running rating average.
- **Family members** — add a family member under patient2 or patient6 and
  book on their behalf.

This file is not meant to be committed/pushed if you'd rather keep your
test roster private — it's just a local reference.
