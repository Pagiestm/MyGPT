<template>
    <div class="mb-4">
        <div class="flex items-center mb-1">
            <label :for="inputName" class="block text-gray-700">
                {{ labelValue }}
            </label>
        </div>
        <input
            :id="inputName"
            :type="type"
            :placeholder="placeholder"
            :value="modelValue"
            class="w-full px-4 py-2 border rounded-lg"
            :class="errorState ? 'border-red-500' : 'border-gray-300'"
            @input="handleInput"
            @blur="$emit('blur')"
        />
        <p v-if="errorState" class="mt-1 text-sm text-red-600">
            {{ errorMessage }}
        </p>
    </div>
</template>

<script setup lang="ts">
defineProps({
    labelValue: {
        type: String,
        required: true
    },
    inputName: {
        type: String,
        required: true
    },
    modelValue: {
        type: [String, Number],
        required: true
    },
    type: {
        type: String,
        default: 'text'
    },
    placeholder: {
        type: String,
        default: ''
    },
    errorMessage: {
        type: String,
        default: ''
    },
    errorState: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue', 'blur']);

function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    emit('update:modelValue', target.value);
}
</script>
