import FmeaList from '@/components/fmea/FmeaList.vue';
import FmeaDetails from '@/components/fmea/FmeaDetails.vue';
import FmeaForm from '@/components/fmea/FmeaForm.vue';

export default [
  {
    path: '/fmea',
    name: 'fmea-list',
    component: FmeaList,
    meta: {
      requiresAuth: true,
      title: 'Análises FMEA',
      permission: 'view_fmea'
    }
  },
  {
    path: '/fmea/new',
    name: 'fmea-create',
    component: FmeaForm,
    meta: {
      requiresAuth: true,
      title: 'Nova Análise FMEA',
      permission: 'create_fmea'
    }
  },
  {
    path: '/fmea/:id',
    name: 'fmea-details',
    component: FmeaDetails,
    meta: {
      requiresAuth: true,
      title: 'Detalhes da Análise FMEA',
      permission: 'view_fmea'
    }
  },
  {
    path: '/fmea/:id/edit',
    name: 'fmea-edit',
    component: FmeaForm,
    props: { isEdit: true },
    meta: {
      requiresAuth: true,
      title: 'Editar Análise FMEA',
      permission: 'edit_fmea'
    }
  }
];

