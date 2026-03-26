DISEASES = [
    {
        "name": "Foot and Mouth Disease (FMD)",
        "symptoms": "High fever, blisters/vesicles on mouth, tongue, gums, feet and teats; excessive salivation; lameness; reduced milk production; loss of appetite",
        "treatment_guidance": "No specific cure. Isolate affected animals immediately. Provide soft food and clean water. Treat secondary bacterial infections with antibiotics. Contact vet for supportive care. Report to authorities as it is a notifiable disease.",
        "affected_species": "Cattle, sheep, goats, pigs, buffalo",
        "severity": "high",
        "is_contagious": "yes",
        "prevention": "Vaccination is key. Quarantine new animals for 21 days. Restrict movement during outbreaks. Disinfect equipment and footwear."
    },
    {
        "name": "Contagious Bovine Pleuropneumonia (CBPP)",
        "symptoms": "Coughing (dry at first, then moist), labored breathing, fever (40-42°C), nasal discharge, reduced milk, weight loss, reluctance to move, pleurisy sounds on chest auscultation",
        "treatment_guidance": "Treat with tylosin or oxytetracycline under veterinary supervision. Isolate infected animals. In endemic areas, slaughter of infected animals may be required. Report to animal health authorities.",
        "affected_species": "Cattle, buffalo",
        "severity": "high",
        "is_contagious": "yes",
        "prevention": "Vaccination with T1/44 or T1sr strains. Control animal movement. Test and slaughter policy in some countries."
    },
    {
        "name": "Foot Rot (Interdigital Necrobacillosis)",
        "symptoms": "Sudden severe lameness in one or more feet, swelling between digits, foul-smelling necrotic tissue between toes, fever, reduced grazing",
        "treatment_guidance": "Clean and trim affected hoof. Apply oxytetracycline spray or copper sulfate solution to lesion. Systemic antibiotics (penicillin or oxytetracycline) for 3-5 days. Provide dry bedding. Consult vet if no improvement in 3 days.",
        "affected_species": "Cattle, sheep, goats",
        "severity": "moderate",
        "is_contagious": "yes",
        "prevention": "Keep hooves trimmed. Avoid wet muddy conditions. Zinc sulfate footbaths. Vaccinate where available."
    },
    {
        "name": "East Coast Fever (ECF)",
        "symptoms": "High fever (over 40°C), swollen lymph nodes (especially parotid), nasal discharge, lacrimation, difficulty breathing, diarrhea, weight loss; can be fatal within 2-3 weeks",
        "treatment_guidance": "Buparvaquone (Butalex) is the drug of choice — administer IM at 2.5mg/kg. Supportive care: antipyretics, fluid therapy. Treat secondary infections. Early treatment is critical. Consult vet immediately.",
        "affected_species": "Cattle, buffalo",
        "severity": "high",
        "is_contagious": "no",
        "prevention": "Tick control using acaricides. Infection and treatment (ITM) method with Theileria parva stabilate and long-acting oxytetracycline. Remove ticks from animals regularly."
    },
    {
        "name": "Lumpy Skin Disease (LSD)",
        "symptoms": "Fever (40-41°C), nodules on skin (10-50mm diameter) especially on head, neck, limbs and genitalia, nasal and ocular discharge, swollen lymph nodes, lameness, reduced milk production",
        "treatment_guidance": "No specific antiviral treatment. Use anti-inflammatory drugs to reduce fever. Treat skin lesions with antiseptic cream. Antibiotics to prevent secondary infections. Supportive care. Isolation mandatory.",
        "affected_species": "Cattle, buffalo",
        "severity": "moderate",
        "is_contagious": "yes",
        "prevention": "Vaccination with Neethling strain vaccine. Vector control (flies, mosquitoes, ticks). Quarantine new animals. Restrict cattle movement during outbreaks."
    }
]

VETS = [
    {
        "name": "Dr. Emeka Okonkwo",
        "phone": "+234-803-456-7890",
        "location": "Kaduna North, Kaduna State",
        "state": "Kaduna",
        "country": "Nigeria",
        "specialization": "Large animal medicine, cattle and small ruminants",
        "available": "yes"
    },
    {
        "name": "Dr. Amina Yusuf",
        "phone": "+234-706-234-5678",
        "location": "Maiduguri, Borno State",
        "state": "Borno",
        "country": "Nigeria",
        "specialization": "Pastoral livestock, zoonotic diseases",
        "available": "yes"
    },
    {
        "name": "Dr. James Mwangi",
        "phone": "+254-722-345-678",
        "location": "Nakuru, Rift Valley",
        "state": "Rift Valley",
        "country": "Kenya",
        "specialization": "Cattle, dairy and beef, tick-borne diseases",
        "available": "yes"
    },
    {
        "name": "Dr. Fatima Al-Hassan",
        "phone": "+234-811-987-6543",
        "location": "Sokoto, Sokoto State",
        "state": "Sokoto",
        "country": "Nigeria",
        "specialization": "Livestock vaccination, outbreak response",
        "available": "yes"
    },
    {
        "name": "Dr. Peter Kamau",
        "phone": "+254-733-456-789",
        "location": "Nairobi, Nairobi County",
        "state": "Nairobi",
        "country": "Kenya",
        "specialization": "Exotic and indigenous cattle, ECF specialist",
        "available": "yes"
    }
]

SUPPLIERS = [
    {
        "name": "Novartis Animal Health Nigeria Ltd",
        "contact_info": "Tel: +234-1-270-1234 | Email: info@novartis-ng.com | Address: Plot 1A, Oba Akran Ave, Ikeja, Lagos",
        "location": "Ikeja, Lagos",
        "website": "https://www.novartis.com",
        "country": "Nigeria"
    },
    {
        "name": "Kenyatta Veterinary Supplies Ltd",
        "contact_info": "Tel: +254-20-445-6789 | Email: orders@kenyattavet.co.ke | Address: Industrial Area, Nairobi",
        "location": "Industrial Area, Nairobi",
        "website": "https://www.kenyattavet.co.ke",
        "country": "Kenya"
    },
    {
        "name": "NAFDAC-Approved Agro-Vet Stores",
        "contact_info": "Tel: +234-9-523-4567 | Email: agrovet@nafdac.gov.ng | Address: 77 Aguiyi-Ironsi St, Abuja",
        "location": "Abuja, FCT",
        "website": "https://www.nafdac.gov.ng",
        "country": "Nigeria"
    },
    {
        "name": "Interchemie Kenya",
        "contact_info": "Tel: +254-722-890-123 | Email: kenya@interchemie.com | Address: Mombasa Road, Nairobi",
        "location": "Mombasa Road, Nairobi",
        "website": "https://www.interchemie.com",
        "country": "Kenya"
    }
]

MEDICINES = [
    {
        "name": "Oxytetracycline 20% LA",
        "type": "Antibiotic",
        "price_range": "₦2,000 - ₦5,000 per 100ml / KSh 500 - KSh 1,200",
        "indication": "Broad-spectrum antibiotic for foot rot, respiratory infections, CBPP supportive treatment, secondary infections",
        "dosage": "20mg/kg IM every 48-72 hours for 3-5 days"
    },
    {
        "name": "Buparvaquone (Butalex)",
        "type": "Antiprotozoal",
        "price_range": "₦8,000 - ₦15,000 per 20ml / KSh 2,000 - KSh 4,500",
        "indication": "East Coast Fever (Theileria parva), Tropical Theileriosis",
        "dosage": "2.5mg/kg IM, single dose; may repeat in 48 hours if no improvement"
    },
    {
        "name": "Tylosin 200 Injectable",
        "type": "Antibiotic",
        "price_range": "₦3,500 - ₦7,000 per 100ml / KSh 900 - KSh 2,000",
        "indication": "CBPP, pneumonia, bovine respiratory disease complex",
        "dosage": "10mg/kg IM daily for 3-5 days"
    },
    {
        "name": "FMD Vaccine (Aftovaxpur DOE)",
        "type": "Vaccine",
        "price_range": "₦500 - ₦1,500 per dose / KSh 150 - KSh 400",
        "indication": "Prevention of Foot and Mouth Disease strains O, A, SAT1, SAT2",
        "dosage": "2ml SC, booster after 4 weeks, then 6-monthly"
    },
    {
        "name": "LSD Neethling Vaccine",
        "type": "Vaccine",
        "price_range": "₦800 - ₦2,000 per dose / KSh 200 - KSh 500",
        "indication": "Prevention of Lumpy Skin Disease",
        "dosage": "1ml SC, annual revaccination required"
    },
    {
        "name": "Copper Sulfate Solution 10%",
        "type": "Topical antiseptic",
        "price_range": "₦500 - ₦1,200 per liter / KSh 120 - KSh 350",
        "indication": "Foot rot treatment, footbath for prevention, hoof hygiene",
        "dosage": "Use as 5-10% footbath solution; apply directly to cleaned lesions"
    },
    {
        "name": "Ivermectin 1% Injectable",
        "type": "Antiparasitic",
        "price_range": "₦1,500 - ₦3,500 per 50ml / KSh 400 - KSh 1,000",
        "indication": "Internal and external parasites, ticks, mange, worms — indirect tick control for ECF prevention",
        "dosage": "0.2mg/kg SC; repeat after 14 days for heavy infestations"
    },
    {
        "name": "Penicillin G Procaine",
        "type": "Antibiotic",
        "price_range": "₦1,200 - ₦3,000 per 100ml / KSh 300 - KSh 800",
        "indication": "Foot rot, wound infections, secondary bacterial infections",
        "dosage": "10,000-20,000 IU/kg IM daily for 3-5 days"
    }
]

# ── Seed animals ─────────────────────────────────────────────────────────────
ANIMALS = [
    {
        "animal_tag": "NG-KAD-001",
        "species": "Cattle",
        "breed": "Bunaji (White Fulani)",
        "sex": "Female",
        "approximate_age": "4 years",
        "owner_name": "Malam Ibrahim Suleiman",
        "herd_name": "Suleiman Herd",
        "village": "Kagarko",
        "country": "Nigeria",
        "notes": "Good milk producer. Vaccinated FMD March 2024."
    },
    {
        "animal_tag": "NG-KAD-002",
        "species": "Cattle",
        "breed": "Bunaji (White Fulani)",
        "sex": "Male",
        "approximate_age": "2 years",
        "owner_name": "Malam Ibrahim Suleiman",
        "herd_name": "Suleiman Herd",
        "village": "Kagarko",
        "country": "Nigeria",
        "notes": "Young breeding bull. Healthy."
    },
    {
        "animal_tag": "KE-NAK-001",
        "species": "Cattle",
        "breed": "Zebu (Boran)",
        "sex": "Female",
        "approximate_age": "5 years",
        "owner_name": "John Kipchoge Mutai",
        "herd_name": "Mutai Farm",
        "village": "Subukia",
        "country": "Kenya",
        "notes": "Previous tick infestation. Watch for ECF symptoms."
    },
    {
        "animal_tag": "KE-NAK-002",
        "species": "Goats",
        "breed": "Galla",
        "sex": "Female",
        "approximate_age": "3 years",
        "owner_name": "John Kipchoge Mutai",
        "herd_name": "Mutai Farm",
        "village": "Subukia",
        "country": "Kenya",
        "notes": "Lactating doe. Good condition."
    },
    {
        "animal_tag": "NG-BOR-001",
        "species": "Cattle",
        "breed": "Red Bororo (Rahaji)",
        "sex": "Female",
        "approximate_age": "6 years",
        "owner_name": "Hajiya Fatima Garba",
        "herd_name": "Garba Pastoral Herd",
        "village": "Konduga",
        "country": "Nigeria",
        "notes": "Older cow. Monitor teeth and body condition score."
    }
]

# ── Seed farmers ─────────────────────────────────────────────────────────────
FARMERS = [
    {
        "phone": "+234-803-111-0001",
        "name": "Malam Ibrahim Suleiman",
        "village": "Kagarko",
        "lga": "Kagarko",
        "state": "Kaduna",
        "country": "Nigeria",
        "preferred_language": "ha",
        "herd_name": "Suleiman Herd",
        "herd_size": 34,
        "verified": True,
    },
    {
        "phone": "+234-806-222-0002",
        "name": "Hajiya Fatima Garba",
        "village": "Konduga",
        "lga": "Konduga",
        "state": "Borno",
        "country": "Nigeria",
        "preferred_language": "ha",
        "herd_name": "Garba Pastoral Herd",
        "herd_size": 52,
        "verified": True,
    },
    {
        "phone": "+254-722-333-0003",
        "name": "John Kipchoge Mutai",
        "village": "Subukia",
        "lga": "Subukia",
        "state": "Nakuru",
        "country": "Kenya",
        "preferred_language": "en",
        "herd_name": "Mutai Farm",
        "herd_size": 18,
        "verified": False,
    },
    {
        "phone": "+234-705-444-0004",
        "name": "Abdullahi Bello",
        "village": "Birnin Kebbi",
        "lga": "Birnin Kebbi",
        "state": "Kebbi",
        "country": "Nigeria",
        "preferred_language": "ff",
        "herd_name": "Bello Cattle",
        "herd_size": 27,
        "verified": False,
    },
]

# ── Seed community posts (keyed by farmer_phone for resolution at seed time) ──
POSTS = [
    {
        "farmer_phone": "+234-803-111-0001",
        "category": "disease_alert",
        "body": "Three of my cows showing fever and blisters on feet. I think FMD. Keep your animals away from Kagarko market this week. I have isolated mine.",
        "village": "Kagarko",
        "state": "Kaduna",
        "country": "Nigeria",
    },
    {
        "farmer_phone": "+254-722-333-0003",
        "category": "water",
        "body": "The borehole at Subukia central is repaired and flowing. Clean water available. Bring your cattle early morning to avoid congestion.",
        "village": "Subukia",
        "state": "Nakuru",
        "country": "Kenya",
    },
    {
        "farmer_phone": "+234-806-222-0002",
        "category": "missing_animal",
        "body": "Missing: one red Bororo bull, no ear tag, about 3 years old. Last seen near Konduga road on Tuesday. Call me if you see it. Reward offered.",
        "village": "Konduga",
        "state": "Borno",
        "country": "Nigeria",
    },
    {
        "farmer_phone": "+234-705-444-0004",
        "category": "market",
        "body": "Cattle market in Birnin Kebbi on Saturday. Good prices expected. I have 5 bulls for sale. Prices starting ₦180,000. Message me.",
        "village": "Birnin Kebbi",
        "state": "Kebbi",
        "country": "Nigeria",
    },
    {
        "farmer_phone": None,
        "category": "advice",
        "body": "Tick season starting. Apply acaricide every 7 days. Check ears, armpits and between toes. ECF kills fast — do not wait.",
        "village": None,
        "state": None,
        "country": "Kenya",
    },
    {
        "farmer_phone": "+254-722-333-0003",
        "category": "pasture",
        "body": "Grass near Subukia dam is good right now after the rains. About 2 km south of the main road. Open to all — no fencing.",
        "village": "Subukia",
        "state": "Nakuru",
        "country": "Kenya",
    },
]

# ── Seed events (keyed by animal_tag for resolution at seed time) ────────────
EVENTS = [
    {
        "animal_tag": "NG-KAD-001",
        "event_type": "illness",
        "event_date": "2024-09-10",
        "symptoms": "Mild lameness in left front leg, slight swelling between toes, foul smell",
        "eating_status": "normal",
        "mobility_status": "reduced",
        "risk_level": "moderate",
        "recommendation": "Clean hoof, apply copper sulfate, monitor 3 days",
        "action_taken": "Hoof trimmed and cleaned. Copper sulfate spray applied.",
        "outcome": "Resolved within 4 days"
    },
    {
        "animal_tag": "NG-KAD-001",
        "event_type": "vaccination",
        "event_date": "2024-03-15",
        "symptoms": None,
        "eating_status": "normal",
        "risk_level": "low",
        "action_taken": "FMD vaccine (Aftovaxpur) 2ml SC administered. Next dose due September 2024.",
        "outcome": "No adverse reaction"
    },
    {
        "animal_tag": "KE-NAK-001",
        "event_type": "illness",
        "event_date": "2024-11-02",
        "symptoms": "High fever (~41°C), swollen parotid lymph nodes, watery nasal discharge",
        "temperature": 41.2,
        "eating_status": "reduced",
        "mobility_status": "reduced",
        "risk_level": "high",
        "recommendation": "Administer Butalex (buparvaquone) 2.5mg/kg IM. Call vet immediately.",
        "action_taken": "Dr. Mwangi called. Buparvaquone administered IM. Antipyretic given.",
        "outcome": "Recovered after 5 days of supportive care"
    },
    {
        "animal_tag": "KE-NAK-001",
        "event_type": "vaccination",
        "event_date": "2024-08-15",
        "symptoms": None,
        "eating_status": "normal",
        "risk_level": "low",
        "action_taken": "ECF ITM vaccination administered by Dr. Mwangi.",
        "outcome": "No adverse reaction"
    },
    {
        "animal_tag": "KE-NAK-002",
        "event_type": "birth",
        "event_date": "2024-10-20",
        "symptoms": None,
        "eating_status": "normal",
        "mobility_status": "normal",
        "risk_level": "low",
        "action_taken": "Normal delivery. Kid healthy. Dam milking well.",
        "outcome": "Healthy kid. Dam recovered normally."
    }
]
