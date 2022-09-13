// use any debounce library
import { debounce } from "throttle-debounce";
import { PiniaPlugin, PiniaPluginContext, PiniaCustomProperties, PiniaCustomStateProperties } from "pinia";

export const DebouncePlugin: PiniaPlugin = (context: PiniaPluginContext): Partial<PiniaCustomProperties & PiniaCustomStateProperties> | void => {
    if (context.options.debounce) {
        return Object.keys(context.options.debounce).reduce((debouncedActions, action) => {
            debouncedActions[action] = debounce(
                (context.options.debounce?.[action] || 0),
                context.store[action]
            )
            return debouncedActions
        }, {})
    }
}