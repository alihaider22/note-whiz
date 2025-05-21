import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import LogOutButton from "./LogOutButton";
import DarkModeToggle from "./DarkModeToggle";
import { shadow } from "@/styles/utils";
import { getUser } from "@/auth/server";

async function Header() {
    const user = await getUser();

    return (
        <header
            className="bg-popover relative flex h-24 w-full items-center justify-between px-3 sm:px-8"
            style={{
                boxShadow: shadow,
            }}
        >
            <Link className="flex items-end gap-2" href="/">
                <Image
                    src="/notewhiz.png"
                    height={60}
                    width={60}
                    alt="logo"
                    className="rounded-full"
                    priority
                />

                <h1 className="flex flex-col pb-1 text-2xl font-semibold leading-6">
                    Note <span>Whiz</span>
                </h1>
            </Link>

            <div className="flex gap-4">
                {user ? (
                    <LogOutButton />
                ) : (
                    <>
                        <Button asChild>
                            <Link href="/sign-up" className="hidden sm:block">
                                Sign Up
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/login">Login</Link>
                        </Button>
                    </>
                )}
                <DarkModeToggle />
            </div>
        </header>
    );
}

export default Header;