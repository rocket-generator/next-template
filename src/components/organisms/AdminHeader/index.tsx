import { User as UserModel } from "@/models/user";
import HeaderUserMenu from "@/components/molecules/HeaderUserMenu";

type Props = {
  signInUser: UserModel | null;
};

export default function AdminHeader({ signInUser }: Props) {
  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b">
      <div className="px-4 h-16 flex items-center justify-end gap-4">
        <HeaderUserMenu signInUser={signInUser} />
      </div>
    </header>
  );
}
