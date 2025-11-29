import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsAgeValid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAgeValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return false;

          const dob = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dob.setHours(0, 0, 0, 0);

          if (dob >= today) return false;

          const age = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          const dayDiff = today.getDate() - dob.getDate();
          const actualAge =
            monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

          return actualAge >= 18;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Date of birth must be valid, in the past, and age must be at least 18 years';
        },
      },
    });
  };
}

