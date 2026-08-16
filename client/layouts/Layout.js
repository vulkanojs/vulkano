import { ref } from 'vue';

export default {
  name: 'Layout',

  setup() {
    const loading = ref(true);

    return {
      loading
    };
  }
};
