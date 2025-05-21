# Input Component Migration Guide

This guide helps you replace NativeBase Input components with our new SimpleInput component to fix casting issues.

## Common Replacements

### Before (NativeBase Input):

```jsx
import { Input, FormControl } from 'native-base';

<FormControl isInvalid={!!errors.email}>
  <FormControl.Label>Email</FormControl.Label>
  <Input
    placeholder="example@email.com"
    value={formData.email}
    onChangeText={(text) => setFormData({...formData, email: text})}
    keyboardType="email-address"
    autoCapitalize="none"
    InputLeftElement={
      <Icon as={MaterialIcons} name="email" size={5} ml="2" color="muted.400" />
    }
  />
  <FormControl.ErrorMessage>{errors.email}</FormControl.ErrorMessage>
</FormControl>
```

### After (SimpleInput):

```jsx
import SimpleInput from '../components/SimpleInput';

<SimpleInput
  label="Email"
  value={formData.email}
  onChangeText={(text) => setFormData({...formData, email: text})}
  placeholder="example@email.com"
  keyboardType="email-address"
  autoCapitalize="none"
  leftIcon="email"
  error={errors.email}
/>
```

## Prioritize These Screens First

Replace inputs in these screens first as they likely have the most issues:

1. Transaction forms (Add Expense, Add Income)
2. Budget creation/editing forms
3. Settings screens 
4. Profile editing screens
5. Any screens with numeric inputs

## Migration Steps

1. Import `SimpleInput` component
2. Replace NativeBase `FormControl` + `Input` with `SimpleInput`
3. Move validation error messages to the `error` prop
4. Replace `InputLeftElement` and `InputRightElement` with `leftIcon` and `rightIcon` props
5. For password fields, use the `isPassword` prop instead of custom eye icons
6. For numeric inputs, add `isNumeric={true}` to handle proper formatting

## Special Cases

### Numerical Inputs

Always use `isNumeric={true}` for:
- Currency amounts
- Percentages
- Phone numbers
- Any other numerical values

### Text Areas

For multiline inputs:

```jsx
<SimpleInput
  label="Notes"
  value={notes}
  onChangeText={setNotes}
  placeholder="Enter notes here..."
  multiline={true}
  numberOfLines={4}
  textAlignVertical="top"
  inputStyle={{ height: 100 }}
/>
```

### Icons

The SimpleInput component currently supports MaterialIcons. Pass just the icon name:

```jsx
<SimpleInput
  leftIcon="person"  // Using MaterialIcons
  // ...other props
/>
```

## Testing

After migration, test each screen by:
1. Entering values in all fields
2. Testing validation
3. Submitting forms
4. Checking console for any remaining "Error while updating property" messages
