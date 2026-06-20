import mongoose, { HydratedDocument, Types } from 'mongoose';
import { hashPassword } from '../../common/utils/security/hash.security';
import { GenderEnum, RoleEnum } from '../../common/enum/user.enum';
import { providerEnum } from '../../common/enum/provider.enum';
import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
  Virtual,
} from '@nestjs/mongoose';

@Schema({
  timestamps: true,
  strictQuery: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class User {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 25 })
  firstName: string;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 25 })
  lastName: string;

  @Virtual({
    get: function (this: User) {
      return `${this.firstName} ${this.lastName}`;
    },
    set: function (this: User, value: string) {
      const parts = value.split(' ');
      this.firstName = parts[0] || '';
      this.lastName = parts.slice(1).join(' ') || '';
    },
  })
  userName: string;

  @Prop({ required: true, unique: true, trim: true })
  email: string;

  @Prop({
    required: function (this: User) {
      return this.provider === providerEnum.system;
    },
  })
  password: string;

  @Prop({
    required: function (this: User) {
      return this.provider === providerEnum.system;
    },
    min: 18,
    max: 60,
  })
  age: number;

  @Prop({ enum: GenderEnum, default: GenderEnum.male })
  gender?: GenderEnum;

  @Prop({ enum: RoleEnum, default: RoleEnum.user })
  role?: RoleEnum;

  @Prop({ type: String, trim: true, default: null })
  phone?: string | null;

  @Prop({ type: String, trim: true, default: null })
  address?: string | null;

  @Prop({ enum: providerEnum, default: providerEnum.system })
  provider?: providerEnum;

  @Prop({ type: String, default: null })
  profilePicture?: string | null;

  @Prop({ type: [String] })
  fcmTokens?: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  friends?: Types.ObjectId[];

  @Prop()
  confirmed?: boolean;

  @Prop()
  isDeleted?: boolean; // Add this property

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type HydratedUserDocument = HydratedDocument<User>;

export const userModel = MongooseModule.forFeatureAsync([
  {
    name: User.name,
    useFactory: () => {
      const schema = UserSchema;

      // Hash password before saving — only if it was modified
      schema.pre('save', function () {
        if (this.isModified('password') && this.password) {
          this.password = hashPassword({ plainText: this.password });
        }
      });

      schema.pre('find', function () {
        console.log('--- Query Middleware (pre-find) ---');
        // @ts-ignore
        console.log(
          `[${new Date().toISOString()}] Hook triggered for model: ${this.model.modelName}`,
        );
        console.log(
          `[${new Date().toISOString()}] Query Filter applied:`,
          this.getFilter(),
        );
      });

      return schema;
    },
  },
]);
