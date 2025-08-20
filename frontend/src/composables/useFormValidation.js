import { ref, reactive, computed } from 'vue'

/**
 * Composable para validação de formulários
 * Fornece validação reativa, mensagens de erro e controle de estado
 */
export function useFormValidation() {
  const errors = ref({})
  const isValidating = ref(false)
  const touchedFields = ref(new Set())

  // Regras de validação comuns
  const validationRules = {
    // Validações básicas
    required: (value, fieldName = 'Campo') => {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return `${fieldName} é obrigatório`
      }
      return null
    },

    // Validações de texto
    minLength: (min) => (value, fieldName = 'Campo') => {
      if (value && value.length < min) {
        return `${fieldName} deve ter pelo menos ${min} caracteres`
      }
      return null
    },

    maxLength: (max) => (value, fieldName = 'Campo') => {
      if (value && value.length > max) {
        return `${fieldName} deve ter no máximo ${max} caracteres`
      }
      return null
    },

    // Validações de email
    email: (value, fieldName = 'Email') => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return `${fieldName} deve ter um formato válido`
      }
      return null
    },

    // Validações de senha
    password: (value, fieldName = 'Senha') => {
      if (!value) return `${fieldName} é obrigatória`
      if (value.length < 6) return `${fieldName} deve ter pelo menos 6 caracteres`
      if (!/(?=.*[a-z])/.test(value)) return `${fieldName} deve conter pelo menos uma letra minúscula`
      if (!/(?=.*[A-Z])/.test(value)) return `${fieldName} deve conter pelo menos uma letra maiúscula`
      if (!/(?=.*\d)/.test(value)) return `${fieldName} deve conter pelo menos um número`
      return null
    },

    passwordSimple: (value, fieldName = 'Senha') => {
      if (!value) return `${fieldName} é obrigatória`
      if (value.length < 6) return `${fieldName} deve ter pelo menos 6 caracteres`
      return null
    },

    // Validações numéricas
    numeric: (value, fieldName = 'Campo') => {
      if (value && !/^\d+$/.test(value.toString())) {
        return `${fieldName} deve conter apenas números`
      }
      return null
    },

    min: (min) => (value, fieldName = 'Campo') => {
      if (value && Number(value) < min) {
        return `${fieldName} deve ser maior ou igual a ${min}`
      }
      return null
    },

    max: (max) => (value, fieldName = 'Campo') => {
      if (value && Number(value) > max) {
        return `${fieldName} deve ser menor ou igual a ${max}`
      }
      return null
    },

    // Validações de confirmação
    confirmPassword: (originalPassword) => (value, fieldName = 'Confirmação de senha') => {
      if (value !== originalPassword) {
        return `${fieldName} não confere com a senha`
      }
      return null
    },

    // Validações customizadas
    custom: (validatorFn, message) => (value, fieldName = 'Campo') => {
      if (!validatorFn(value)) {
        return message || `${fieldName} é inválido`
      }
      return null
    },

    // Validações de CPF
    cpf: (value, fieldName = 'CPF') => {
      if (!value) return null
      
      const cpf = value.replace(/\D/g, '')
      if (cpf.length !== 11) return `${fieldName} deve ter 11 dígitos`
      
      // Verificar se todos os dígitos são iguais
      if (/^(\d)\1+$/.test(cpf)) return `${fieldName} inválido`
      
      // Validar dígitos verificadores
      let sum = 0
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i)
      }
      let remainder = 11 - (sum % 11)
      if (remainder === 10 || remainder === 11) remainder = 0
      if (remainder !== parseInt(cpf.charAt(9))) return `${fieldName} inválido`
      
      sum = 0
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i)
      }
      remainder = 11 - (sum % 11)
      if (remainder === 10 || remainder === 11) remainder = 0
      if (remainder !== parseInt(cpf.charAt(10))) return `${fieldName} inválido`
      
      return null
    },

    // Validações de telefone
    phone: (value, fieldName = 'Telefone') => {
      if (value && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(value)) {
        return `${fieldName} deve ter o formato (00) 00000-0000`
      }
      return null
    }
  }

  /**
   * Valida um campo específico
   */
  const validateField = (fieldName, value, rules, formData = null) => {
    const fieldErrors = []
    
    for (const rule of rules) {
      let validator, fieldLabel
      
      if (typeof rule === 'function') {
        validator = rule
        fieldLabel = fieldName
      } else if (rule.validator) {
        validator = rule.validator
        fieldLabel = rule.label || fieldName
      } else {
        continue
      }
      
      const error = validator(value, fieldLabel, formData)
      if (error) {
        fieldErrors.push(error)
        break // Parar na primeira regra que falhar
      }
    }
    
    if (fieldErrors.length > 0) {
      errors.value[fieldName] = fieldErrors[0]
    } else {
      delete errors.value[fieldName]
    }
    
    return fieldErrors.length === 0
  }

  /**
   * Valida todo o formulário
   */
  const validateForm = (formData, validationSchema) => {
    isValidating.value = true
    errors.value = {}
    let isValid = true
    
    for (const [fieldName, rules] of Object.entries(validationSchema)) {
      const fieldValue = formData[fieldName]
      const fieldValid = validateField(fieldName, fieldValue, rules, formData)
      
      if (!fieldValid) {
        isValid = false
      }
      
      touchedFields.value.add(fieldName)
    }
    
    isValidating.value = false
    return isValid
  }

  /**
   * Marca um campo como "tocado" para exibir erros
   */
  const touchField = (fieldName) => {
    touchedFields.value.add(fieldName)
  }

  /**
   * Verifica se um campo foi tocado
   */
  const isFieldTouched = (fieldName) => {
    return touchedFields.value.has(fieldName)
  }

  /**
   * Verifica se deve mostrar erro para um campo
   */
  const shouldShowError = (fieldName) => {
    return isFieldTouched(fieldName) && errors.value[fieldName]
  }

  /**
   * Limpa todos os erros
   */
  const clearErrors = () => {
    errors.value = {}
    touchedFields.value.clear()
  }

  /**
   * Limpa erro de um campo específico
   */
  const clearFieldError = (fieldName) => {
    delete errors.value[fieldName]
  }

  /**
   * Adiciona erro customizado
   */
  const setFieldError = (fieldName, message) => {
    errors.value[fieldName] = message
    touchedFields.value.add(fieldName)
  }

  /**
   * Verifica se o formulário tem erros
   */
  const hasErrors = computed(() => {
    return Object.keys(errors.value).length > 0
  })

  /**
   * Obtém erro de um campo
   */
  const getFieldError = (fieldName) => {
    return shouldShowError(fieldName) ? errors.value[fieldName] : null
  }

  /**
   * Valida campo em tempo real (para input events)
   */
  const validateFieldOnInput = (fieldName, value, rules, formData = null) => {
    if (isFieldTouched(fieldName)) {
      validateField(fieldName, value, rules, formData)
    }
  }

  /**
   * Configura validação automática para um campo
   */
  const setupFieldValidation = (fieldName, rules, formData) => {
    return {
      onBlur: () => {
        touchField(fieldName)
        validateField(fieldName, formData[fieldName], rules, formData)
      },
      onInput: () => {
        validateFieldOnInput(fieldName, formData[fieldName], rules, formData)
      }
    }
  }

  return {
    // Estado
    errors,
    isValidating,
    hasErrors,
    
    // Regras de validação
    rules: validationRules,
    
    // Métodos de validação
    validateField,
    validateForm,
    validateFieldOnInput,
    
    // Controle de estado
    touchField,
    isFieldTouched,
    shouldShowError,
    clearErrors,
    clearFieldError,
    setFieldError,
    getFieldError,
    setupFieldValidation
  }
}

/**
 * Schemas de validação pré-definidos para formulários comuns
 */
export const validationSchemas = {
  // Schema para login
  login: {
    email: [
      (value) => validationRules.required(value, 'Email'),
      validationRules.email
    ],
    senha: [
      (value) => validationRules.required(value, 'Senha'),
      validationRules.minLength(6)
    ]
  },

  // Schema para criação de usuário
  createUser: {
    nome: [
      (value) => validationRules.required(value, 'Nome'),
      validationRules.minLength(2),
      validationRules.maxLength(100)
    ],
    email: [
      (value) => validationRules.required(value, 'Email'),
      validationRules.email
    ],
    perfil: [
      (value) => validationRules.required(value, 'Perfil')
    ],
    departamento: [
      (value) => validationRules.required(value, 'Departamento')
    ],
    senha: [
      validationRules.passwordSimple
    ]
  },

  // Schema para categorias
  category: {
    nome: [
      (value) => validationRules.required(value, 'Nome'),
      validationRules.minLength(2),
      validationRules.maxLength(50)
    ],
    cor: [
      (value) => validationRules.required(value, 'Cor')
    ],
    icone: [
      (value) => validationRules.required(value, 'Ícone')
    ]
  },

  // Schema para solicitações
  solicitacao: {
    titulo: [
      (value) => validationRules.required(value, 'Título'),
      validationRules.minLength(5),
      validationRules.maxLength(200)
    ],
    descricao: [
      (value) => validationRules.required(value, 'Descrição'),
      validationRules.minLength(10),
      validationRules.maxLength(1000)
    ],
    categoria: [
      (value) => validationRules.required(value, 'Categoria')
    ],
    localizacao: [
      (value) => validationRules.required(value, 'Localização'),
      validationRules.maxLength(200)
    ]
  }
}