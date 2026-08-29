import { ref } from 'vue';

export default {
  // Props
  props: {
    msg: String
  },

  setup() {
    const count = ref(1);

    return {
      count
    };
  }
};
