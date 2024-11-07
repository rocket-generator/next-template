import { Bell } from "lucide-react";
import { User as UserModel } from "@/models/user";
import SignInUserMenu from "@/components/molecules/SignInUserMenu";

type Props = {
  signInUser: UserModel | null;
};

const Header = ({ signInUser }: Props) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b">
      <div className="px-4 h-16 flex items-center justify-end gap-4">
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Bell className="w-5 h-5" />
        </button>
        <SignInUserMenu signInUser={signInUser} />
      </div>
    </header>
  );
};

export default Header;
