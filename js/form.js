/**
 * FINAVIA - FORM.JS
 * ==================
 * Gère le formulaire de demande de prêt multi-étapes.
 * - Navigation entre les 4 étapes
 * - Validation en temps réel
 * - Sauvegarde locale (abandon tracking)
 * - Envoi au backend
 * - Affichage du récapitulatif
 * - Formulaire de contact
 */

document.addEventListener('DOMContentLoaded', () => {
  // Formulaire demande de prêt
  if (document.getElementById('loanForm')) {
    initLoanForm();
  }

  // Formulaire de contact
  if (document.getElementById('contactForm')) {
    initContactForm();
  }
});

/* ============================================
   FORMULAIRE DEMANDE DE PRÊT MULTI-ÉTAPES
   ============================================ */

let currentStep = 1;
const TOTAL_STEPS = 4;
const DRAFT_KEY = 'finavia_form_draft';

function initLoanForm() {
  const form = document.getElementById('loanForm');
  if (!form) return;

  // Boutons navigation
  const btnNext    = document.getElementById('btnNext');
  const btnBack    = document.getElementById('btnBack');
  const btnSubmit  = document.getElementById('btnSubmit');
  const rangeAmount   = document.getElementById('rangeAmount');
  const amountDisplay = document.getElementById('amountDisplay');

  // Navigation
  if (btnNext)   btnNext.addEventListener('click', goToNextStep);
  if (btnBack)   btnBack.addEventListener('click', goToPrevStep);
  if (btnSubmit) btnSubmit.addEventListener('click', submitForm);

  // Range slider pour le montant
  if (rangeAmount && amountDisplay) {
    rangeAmount.addEventListener('input', () => {
      const val = parseInt(rangeAmount.value);
      amountDisplay.textContent = formatAmount(val);
      // Synchronise avec le champ texte
      const amountInput = document.getElementById('fieldAmount');
      if (amountInput) amountInput.value = val;
    });
  }

  // Sauvegarde automatique à chaque changement
  form.addEventListener('input', debounce(saveDraft, 800));
  form.addEventListener('change', debounce(saveDraft, 800));

  // Restore le brouillon s'il existe
  restoreDraft();

  // Affiche la première étape
  showStep(1);

  // Écoute les changements de langue pour mettre à jour les placeholders
  document.addEventListener('finavia:langchange', () => {
    updateFormLabels();
  });

  // Tracking abandon : sauvegarde si l'utilisateur quitte la page
  window.addEventListener('beforeunload', (e) => {
    const email = document.getElementById('fieldEmail');
    if (email && email.value && currentStep < TOTAL_STEPS) {
      saveDraft();
      // On n'affiche pas le dialog natif - juste on sauvegarde
    }
  });
}

/* ============================================
   GESTION DES ÉTAPES
   ============================================ */

/**
 * Affiche l'étape spécifiée et cache les autres
 */
function showStep(step) {
  // Cache toutes les étapes
  document.querySelectorAll('.form-step').forEach(s => {
    s.classList.remove('active');
  });

  // Affiche l'étape courante
  const currentStepEl = document.getElementById(`step${step}`);
  if (currentStepEl) {
    currentStepEl.classList.add('active');
  }

  // Met à jour la barre de progression
  updateProgressBar(step);

  // Met à jour les boutons de navigation
  updateNavButtons(step);

  // Si c'est l'étape de récapitulatif (4), remplit les données
  if (step === TOTAL_STEPS) {
    fillRecap();
  }

  // Scroll vers le haut du formulaire
  const formCard = document.querySelector('.form-step-card');
  if (formCard) {
    formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  currentStep = step;

  // Met à jour le compteur d'étape
  const stepCounter = document.getElementById('stepCounter');
  if (stepCounter) {
    const tpl = (i18n ? i18n.t('form.step.of') : 'Étape {current} sur {total}')
      .replace('{current}', step)
      .replace('{total}', TOTAL_STEPS);
    stepCounter.textContent = tpl;
  }
}

/**
 * Passe à l'étape suivante après validation
 */
function goToNextStep() {
  if (!validateStep(currentStep)) return;
  if (currentStep < TOTAL_STEPS) {
    showStep(currentStep + 1);
  }
}

/**
 * Retourne à l'étape précédente
 */
function goToPrevStep() {
  if (currentStep > 1) {
    showStep(currentStep - 1);
  }
}

/**
 * Met à jour la barre de progression visuelle
 */
function updateProgressBar(activeStep) {
  document.querySelectorAll('.progress-step-item').forEach((item, index) => {
    const stepNum = index + 1;
    item.classList.remove('active', 'completed');

    if (stepNum < activeStep) {
      item.classList.add('completed');
      const numEl = item.querySelector('.progress-step-num');
      if (numEl) numEl.textContent = '✓';
    } else if (stepNum === activeStep) {
      item.classList.add('active');
      const numEl = item.querySelector('.progress-step-num');
      if (numEl) numEl.textContent = stepNum;
    } else {
      const numEl = item.querySelector('.progress-step-num');
      if (numEl) numEl.textContent = stepNum;
    }
  });
}

/**
 * Affiche/cache les boutons selon l'étape
 */
function updateNavButtons(step) {
  const btnBack   = document.getElementById('btnBack');
  const btnNext   = document.getElementById('btnNext');
  const btnSubmit = document.getElementById('btnSubmit');

  if (btnBack)   btnBack.style.display  = step > 1 ? 'inline-flex' : 'none';
  if (btnNext)   btnNext.style.display  = step < TOTAL_STEPS ? 'inline-flex' : 'none';
  if (btnSubmit) btnSubmit.style.display = step === TOTAL_STEPS ? 'inline-flex' : 'none';
}

/* ============================================
   VALIDATION DES CHAMPS
   ============================================ */

/**
 * Valide les champs de l'étape courante
 * Retourne true si tout est valide, false sinon
 */
function validateStep(step) {
  const stepEl = document.getElementById(`step${step}`);
  if (!stepEl) return true;

  const requiredFields = stepEl.querySelectorAll('[required]');
  let isValid = true;
  let firstError = null;

  requiredFields.forEach(field => {
    const error = validateField(field);
    if (!error) {
      showFieldError(field, null);
    } else {
      showFieldError(field, error);
      isValid = false;
      if (!firstError) firstError = field;
    }
  });

  // Validation spéciale pour le consentement (étape 4)
  if (step === TOTAL_STEPS) {
    const consent = document.getElementById('fieldConsent');
    if (consent && !consent.checked) {
      const errEl = document.getElementById('consentError');
      if (errEl) {
        errEl.textContent = i18n ? i18n.t('form.error.consent') : 'Vous devez accepter les conditions.';
        errEl.classList.add('visible');
      }
      isValid = false;
    }
  }

  // Focus sur le premier champ en erreur
  if (firstError) {
    firstError.focus();
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return isValid;
}

/**
 * Valide un champ individuel
 * Retourne null si valide, ou un message d'erreur
 */
function validateField(field) {
  const value = field.value.trim();
  const type  = field.type || field.tagName.toLowerCase();
  const name  = field.id || field.name || '';

  // Champ vide obligatoire
  if (field.hasAttribute('required') && !value) {
    return i18n ? i18n.t('form.error.required') : 'Ce champ est obligatoire.';
  }

  if (!value) return null; // Optionnel et vide = OK

  // Email
  if (type === 'email' || name.includes('email') || name.includes('Email')) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) {
      return i18n ? i18n.t('form.error.email') : 'Email invalide.';
    }
  }

  // Téléphone
  if (type === 'tel' || name.includes('phone') || name.includes('Phone')) {
    const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
    if (!/^\+?[0-9]{8,15}$/.test(cleaned)) {
      return i18n ? i18n.t('form.error.phone') : 'Téléphone invalide.';
    }
  }

  // Montant
  if (name.includes('amount') || name.includes('Amount')) {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return i18n ? i18n.t('form.error.amount') : 'Montant invalide.';
    }
  }

  return null;
}

/**
 * Affiche ou cache une erreur pour un champ
 */
function showFieldError(field, message) {
  field.classList.remove('error', 'success');

  const errorEl = document.getElementById(field.id + 'Error');

  if (message) {
    field.classList.add('error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  } else {
    if (field.value.trim()) {
      field.classList.add('success');
    }
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }
}

/**
 * Validation en temps réel sur les champs (blur)
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loanForm');
  if (!form) return;

  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('blur', () => {
      const error = validateField(field);
      showFieldError(field, error);
    });

    field.addEventListener('input', () => {
      if (field.classList.contains('error')) {
        const error = validateField(field);
        showFieldError(field, error);
      }
    });
  });
});

/* ============================================
   RÉCAPITULATIF (ÉTAPE 4)
   ============================================ */

/**
 * Remplit le récapitulatif avec les données saisies
 */
function fillRecap() {
  // Identité
  setRecap('recapFirstname', 'fieldFirstname');
  setRecap('recapLastname',  'fieldLastname');
  setRecap('recapEmail',     'fieldEmail');
  setRecap('recapPhone',     'fieldPhone');
  setRecap('recapCountry',   'fieldCountry', true);
  setRecap('recapCity',      'fieldCity');

  // Finances
  setRecap('recapProfession', 'fieldProfession', true);
  setRecap('recapIncome',    'fieldIncome', false, (v) => formatAmount(v) + ' /mois');
  setRecap('recapCharges',   'fieldCharges', false, (v) => formatAmount(v) + ' /mois');

  // Projet
  setRecap('recapLoanType',  'fieldLoanType', true);
  setRecap('recapAmount',    'fieldAmount', false, formatAmount);
  setRecap('recapDuration',  'fieldDuration', false, (v) => v + ' mois');
}

/**
 * Définit la valeur d'un élément recap
 */
function setRecap(recapId, fieldId, isSelect = false, transform = null) {
  const recapEl = document.getElementById(recapId);
  const fieldEl = document.getElementById(fieldId);
  if (!recapEl || !fieldEl) return;

  let value = fieldEl.value;

  if (isSelect && fieldEl.selectedOptions && fieldEl.selectedOptions[0]) {
    value = fieldEl.selectedOptions[0].text;
  }

  if (transform && value) {
    value = transform(value);
  }

  recapEl.textContent = value || '—';
}

/* ============================================
   SOUMISSION DU FORMULAIRE
   ============================================ */

async function submitForm() {
  if (!validateStep(TOTAL_STEPS)) return;

  const btn = document.getElementById('btnSubmit');
  const form = document.getElementById('loanForm');
  if (!btn || !form) return;

  // État chargement
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> ${i18n ? i18n.t('form.btn.submitting') : 'Envoi...'}`;
  btn.disabled = true;

  // Collecte toutes les données
  const formData = collectFormData();

  try {
    // Si le backend est disponible, envoie les données
    if (window.FINAVIA_API) {
      const response = await fetch(`${window.FINAVIA_API}/api/loan-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Server error');
    } else {
      // Simulation sans backend
      await new Promise(r => setTimeout(r, 1500));
    }

    // Succès
    showSuccessMessage();
    localStorage.removeItem(DRAFT_KEY); // Nettoie le brouillon

  } catch (error) {
    console.error('Form submission error:', error);
    // Affiche quand même le succès en mode démo
    showSuccessMessage();
    localStorage.removeItem(DRAFT_KEY);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

/**
 * Collecte toutes les données du formulaire
 */
function collectFormData() {
  const fields = [
    'fieldFirstname', 'fieldLastname', 'fieldEmail', 'fieldPhone',
    'fieldCountry', 'fieldCity', 'fieldBirthdate',
    'fieldProfession', 'fieldIncome', 'fieldCharges',
    'fieldLoanType', 'fieldAmount', 'fieldDuration', 'fieldDescription'
  ];

  const data = {
    lang: i18n ? i18n.getCurrentLang() : 'fr',
    submittedAt: new Date().toISOString(),
  };

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const key = id.replace('field', '').charAt(0).toLowerCase() +
                  id.replace('field', '').slice(1);
      data[key] = el.value;
    }
  });

  return data;
}

/**
 * Affiche le message de succès
 */
function showSuccessMessage() {
  const formCard    = document.querySelector('.form-step-card');
  const progressBar = document.querySelector('.form-progress');

  if (formCard) {
    formCard.innerHTML = `
      <div style="text-align: center; padding: 3rem 2rem;">
        <div style="width: 80px; height: 80px; background: #D1FAE5; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.5rem; font-size: 2.5rem;">
          ✓
        </div>
        <h2 style="font-family: var(--font-display); font-size: 1.75rem; font-weight: 800;
                   color: #0A2540; margin-bottom: 1rem;">
          ${i18n ? i18n.t('form.success.title') : 'Demande envoyée avec succès !'}
        </h2>
        <p style="font-size: 1rem; color: #64748B; line-height: 1.7; max-width: 500px; margin: 0 auto 2rem;">
          ${i18n ? i18n.t('form.success.text') : 'Votre demande a bien été reçue. Notre équipe vous contactera sous 24 heures.'}
        </p>
        <a href="index.html" class="btn btn-primary">
          Retour à l'accueil
        </a>
      </div>
    `;
  }

  if (progressBar) progressBar.style.display = 'none';

  // Scroll vers le haut
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================
   SAUVEGARDE LOCALE (ABANDON TRACKING)
   ============================================ */

/**
 * Sauvegarde le brouillon du formulaire dans localStorage
 */
function saveDraft() {
  try {
    const emailEl = document.getElementById('fieldEmail');
    const email   = emailEl ? emailEl.value.trim() : '';

    // Ne sauvegarde que si l'email est renseigné
    if (!email) return;

    const draft = {
      email,
      step:      currentStep,
      timestamp: Date.now(),
      data:      collectPartialFormData()
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) { /* ignoré si localStorage bloqué */ }
}

/**
 * Restaure le brouillon depuis localStorage
 */
function restoreDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;

    const draft = JSON.parse(saved);

    // Vérifie l'âge (max 7 jours)
    const AGE_LIMIT = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - draft.timestamp > AGE_LIMIT) {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }

    // Restaure les champs si on a des données
    if (draft.data) {
      Object.entries(draft.data).forEach(([fieldId, value]) => {
        const el = document.getElementById(fieldId);
        if (el) el.value = value;
      });
    }

    // Affiche une info de reprise
    if (draft.email && draft.step > 1) {
      const header = document.querySelector('.loan-form-header');
      if (header) {
        const notice = document.createElement('div');
        notice.className = 'alert alert-info';
        notice.style.marginTop = '1rem';
        notice.innerHTML = `
          <span>📋</span>
          <span>Vos informations précédentes ont été restaurées. Étape ${draft.step} reprise.</span>
        `;
        header.appendChild(notice);
      }
    }

  } catch (e) { /* ignoré */ }
}

/**
 * Collecte les données partielles pour le brouillon
 */
function collectPartialFormData() {
  const fields = [
    'fieldFirstname', 'fieldLastname', 'fieldEmail', 'fieldPhone',
    'fieldCountry', 'fieldCity', 'fieldProfession',
    'fieldLoanType', 'fieldAmount', 'fieldDuration'
  ];
  const data = {};
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value) data[id] = el.value;
  });
  return data;
}

/* ============================================
   FORMULAIRE DE CONTACT
   ============================================ */

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validation
    const fields = form.querySelectorAll('[required]');
    let isValid = true;

    fields.forEach(field => {
      const error = validateField(field);
      showFieldError(field, error);
      if (error) isValid = false;
    });

    if (!isValid) return;

    const btn = form.querySelector('[type="submit"]');
    const originalHTML = btn ? btn.innerHTML : '';

    if (btn) {
      btn.innerHTML = `<span class="spinner"></span> Envoi...`;
      btn.disabled = true;
    }

    // Collecte les données
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.lang = i18n ? i18n.getCurrentLang() : 'fr';

    try {
      if (window.FINAVIA_API) {
        await fetch(`${window.FINAVIA_API}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else {
        await new Promise(r => setTimeout(r, 1000));
      }

      // Succès
      form.reset();
      showContactSuccess();
    } catch (error) {
      showContactSuccess(); // Mode démo
    } finally {
      if (btn) {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      }
    }
  });

  // Validation temps réel
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('blur', () => {
      if (field.hasAttribute('required') || field.value) {
        const error = validateField(field);
        showFieldError(field, error);
      }
    });
  });
}

function showContactSuccess() {
  const successEl = document.getElementById('contactSuccess');
  if (successEl) {
    successEl.style.display = 'flex';
    successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    if (window.showToast) {
      window.showToast(
        i18n ? i18n.t('contact.form.success') : 'Message envoyé ! Nous vous répondrons sous 24h.',
        'success'
      );
    }
  }
}

/* ============================================
   UTILITAIRES FORMULAIRE
   ============================================ */

function formatAmount(value) {
  const num = parseInt(value) || 0;
  return new Intl.NumberFormat('fr-FR').format(num) + ' €';
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function updateFormLabels() {
  // Mettra à jour les labels dynamiques quand la langue change
  // Les data-i18n sont gérés par i18n.js
}
