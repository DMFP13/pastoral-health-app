"""
Rules-based triage engine.
All logic is explicit and transparent — no ML, no black boxes.
Each rule has an associated rationale string so the output is always explainable.
"""
from schemas import TriageInput, TriageOutput, ConditionMatch


def run_triage(data: TriageInput, suggested_vets=None) -> TriageOutput:
    species = data.species.lower().strip()
    conditions: list[ConditionMatch] = []
    rationale: list[str] = []

    # ── Rule 1: FMD (all livestock species) ─────────────────────────────────
    # Classic presentation: fever + salivation + lesions (mouth or feet)
    if (data.fever or data.salivation) and data.lesions:
        conditions.append(ConditionMatch(
            condition="Foot and Mouth Disease (FMD)",
            confidence="likely",
            economic_note=(
                "Entire herd is at risk — one infected animal can spread FMD to all others. "
                "Milk production will drop sharply. Movement ban required. Report to authorities."
            )
        ))
        rationale.append(
            "Fever or excess salivation combined with lesions is the classic FMD triad. "
            "FMD causes blisters in the mouth and on feet."
        )
    elif data.salivation and data.lameness:
        conditions.append(ConditionMatch(
            condition="Foot and Mouth Disease (FMD)",
            confidence="possible",
            economic_note=(
                "Even suspected FMD requires immediate isolation to protect the herd."
            )
        ))
        rationale.append(
            "Salivation with lameness may indicate early foot-and-mouth lesions. "
            "Inspect mouth and feet carefully for blisters or ulcers."
        )

    # ── Rule 2: CBPP (cattle and buffalo only) ──────────────────────────────
    if data.coughing and data.fever and species in ("cattle", "buffalo"):
        conditions.append(ConditionMatch(
            condition="Contagious Bovine Pleuropneumonia (CBPP)",
            confidence="likely",
            economic_note=(
                "CBPP can kill infected cattle and spreads through shared air and close contact. "
                "Reduces milk output and causes significant weight loss."
            )
        ))
        rationale.append(
            "Coughing combined with fever in cattle is a key indicator of CBPP "
            "(lung infection caused by Mycoplasma mycoides). "
            "Listen for a moist cough and laboured breathing."
        )
    elif data.coughing and not data.fever and species in ("cattle", "buffalo"):
        conditions.append(ConditionMatch(
            condition="Bovine Respiratory Disease (possible CBPP)",
            confidence="possible",
            economic_note=(
                "Respiratory disease reduces weight gain and milk. "
                "Monitor temperature — if fever develops, treat urgently."
            )
        ))
        rationale.append(
            "Coughing without fever may be early CBPP, dust irritation, or another respiratory infection. "
            "Monitor closely and check temperature twice daily."
        )

    # ── Rule 3: ECF (cattle and buffalo only) ───────────────────────────────
    if data.fever and data.nasal_discharge and species in ("cattle", "buffalo"):
        conditions.append(ConditionMatch(
            condition="East Coast Fever (ECF)",
            confidence="likely",
            economic_note=(
                "ECF can be fatal within 2–3 weeks if untreated. "
                "Buparvaquone (Butalex) is the specific treatment — administer as early as possible."
            )
        ))
        rationale.append(
            "High fever with nasal/eye discharge in cattle is characteristic of ECF "
            "(caused by Theileria parva transmitted by brown ear ticks). "
            "Check for swollen lymph nodes around the head and neck."
        )

    # ── Rule 4: LSD (cattle and buffalo only) ───────────────────────────────
    # Differentiate from FMD: LSD lesions are on skin, not mouth; no salivation
    if data.lesions and data.fever and species in ("cattle", "buffalo") and not data.salivation:
        conditions.append(ConditionMatch(
            condition="Lumpy Skin Disease (LSD)",
            confidence="likely",
            economic_note=(
                "LSD reduces milk production and causes skin damage that affects market value. "
                "Spread by flies and mosquitoes — control vectors urgently."
            )
        ))
        rationale.append(
            "Raised skin nodules (10–50mm) with fever in cattle, without excess salivation, "
            "points to LSD rather than FMD. Check neck, back, and limbs for firm nodules."
        )

    # ── Rule 5: Foot Rot ────────────────────────────────────────────────────
    if data.lameness and not data.fever and not data.salivation and not data.lesions:
        conditions.append(ConditionMatch(
            condition="Foot Rot (Interdigital Necrobacillosis)",
            confidence="likely",
            economic_note=(
                "Untreated foot rot causes chronic lameness, reducing grazing and weight gain. "
                "Early antibiotic treatment prevents permanent hoof damage."
            )
        ))
        rationale.append(
            "Lameness without fever, salivation, or visible lesions suggests localised foot rot "
            "(bacterial infection between the toes). Check for swelling and foul smell between digits."
        )
    elif data.lameness and data.fever and not data.lesions and not data.salivation:
        # Lameness + fever without lesions could be foot rot with secondary infection
        conditions.append(ConditionMatch(
            condition="Foot Rot with secondary infection",
            confidence="possible",
            economic_note=(
                "Infected foot rot spreads quickly — treat with systemic antibiotics now."
            )
        ))
        rationale.append(
            "Lameness with fever (but no lesions or salivation) may indicate foot rot "
            "that has progressed to a systemic infection."
        )

    # ── Rule 6: Mastitis ────────────────────────────────────────────────────
    milking_species = ("cattle", "goats", "sheep", "buffalo")
    if data.eating is False and species in milking_species and not data.fever:
        conditions.append(ConditionMatch(
            condition="Mastitis",
            confidence="possible",
            economic_note=(
                "Mastitis causes significant milk loss — up to 25% per quarter affected. "
                "Check udder for heat, hardness, swelling, or watery/clotted milk."
            )
        ))
        rationale.append(
            "Reduced appetite in a milking animal without fever is a common sign of mastitis. "
            "Inspect all four udder quarters for asymmetry, heat, and abnormal milk."
        )

    # ── Rule 7: Heat Stress ─────────────────────────────────────────────────
    if not conditions and data.eating is False and not data.fever:
        conditions.append(ConditionMatch(
            condition="Heat Stress",
            confidence="possible",
            economic_note=(
                "Heat stress reduces milk production by up to 20% and impairs fertility. "
                "Provide shade, water, and reduce handling during hottest hours."
            )
        ))
        rationale.append(
            "Reduced appetite without fever or specific symptoms may indicate heat stress, "
            "especially during hot dry seasons or in animals without adequate shade."
        )

    # ── Rule 8: Possible Estrus ─────────────────────────────────────────────
    if (not conditions or all(c.confidence == "possible" for c in conditions)):
        if species == "cattle" and data.pregnancy_status == "not_pregnant":
            conditions.append(ConditionMatch(
                condition="Possible Estrus (heat cycle)",
                confidence="possible",
                economic_note=(
                    "Animals in estrus are ready for breeding or AI. "
                    "Good fertility is a key productivity indicator."
                )
            ))
            rationale.append(
                "A non-pregnant cow showing behavioural changes (restlessness, mounting, "
                "reduced appetite) without illness signs may be in estrus."
            )

    # ── Determine overall risk level ────────────────────────────────────────
    emergency_conditions = {"Foot and Mouth Disease (FMD)"}
    high_conditions = {
        "Contagious Bovine Pleuropneumonia (CBPP)",
        "East Coast Fever (ECF)",
    }

    matched_names = {c.condition for c in conditions}
    has_emergency = bool(matched_names & emergency_conditions) and \
                    any(c.confidence == "likely" for c in conditions
                        if c.condition in emergency_conditions)
    has_high = bool(matched_names & high_conditions)

    if has_emergency or (data.fever and data.lesions and data.salivation):
        risk_level = "emergency"
        recommendation = (
            "Isolate this animal from the herd immediately. "
            "Call a vet now — do not wait. Do not move the animal off your land. "
            "This may be a notifiable disease."
        )
        urgency_hours = 2
        isolate = True
        call_vet = True

    elif has_high or (data.fever and len(conditions) > 1):
        risk_level = "high"
        recommendation = (
            "Isolate this animal now. Seek veterinary treatment within 24 hours. "
            "Do not sell or move the animal until a vet has assessed it."
        )
        urgency_hours = 24
        isolate = True
        call_vet = True

    elif any(c.condition in {"Foot Rot (Interdigital Necrobacillosis)",
                              "Foot Rot with secondary infection",
                              "Lumpy Skin Disease (LSD)",
                              "Mastitis"}
             for c in conditions):
        risk_level = "moderate"
        recommendation = (
            "Begin treatment with available medicines. Monitor the animal twice daily. "
            "If no improvement after 2–3 days, contact a vet."
        )
        urgency_hours = 48
        isolate = False
        call_vet = False

    elif conditions:
        risk_level = "low"
        recommendation = (
            "Monitor this animal closely. Provide clean water, adequate feed, and shade. "
            "Log daily observations and contact a vet if symptoms worsen."
        )
        urgency_hours = None
        isolate = False
        call_vet = False

    else:
        risk_level = "low"
        recommendation = (
            "No specific disease pattern detected from the symptoms provided. "
            "Continue monitoring. Ensure the animal has clean water, feed, and shade."
        )
        urgency_hours = None
        isolate = False
        call_vet = False
        rationale.append(
            "No symptom combination matched a known disease pattern. "
            "Consider re-checking symptoms or consulting a vet for a physical examination."
        )

    # ── Compile economic note ────────────────────────────────────────────────
    econ_notes = [c.economic_note for c in conditions if c.economic_note]
    economic_note = (
        econ_notes[0] if len(econ_notes) == 1
        else "\n\n".join(econ_notes) if econ_notes
        else "Monitor animal health closely to prevent productivity and income losses."
    )

    return TriageOutput(
        likely_conditions=conditions,
        risk_level=risk_level,
        recommendation=recommendation,
        urgency_hours=urgency_hours,
        isolate_animal=isolate,
        call_vet=call_vet,
        rationale=rationale,
        economic_note=economic_note,
        suggested_vets=suggested_vets or [],
    )
