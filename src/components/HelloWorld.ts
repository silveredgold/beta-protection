import { Options, Prop, Vue } from 'vue-property-decorator';
import {  } from "vue-class-component";
import { ComponentOptions } from 'vue';

import { defineComponent } from 'vue'

export default defineComponent({
  data() {
      return {
          msg: "Hello!"
      }
  }
});

const options: ComponentOptions = {
    data() {
        return {
             msg: "Hello!"
        }
    }
}