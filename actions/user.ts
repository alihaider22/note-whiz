"use server";

import { createClient } from "@/auth/server";

export const loginAction = async (email: string, password: string) => {
    try {
        const { auth } = await createClient();

        const { error } = await auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;

        return { errorMessage: null };
    } catch (error) {
        // Handle error here
        console.log("Error logging in:", error);
        // return handleError(error);
    }
};

export const logOutAction = async () => {
    try {
        const { auth } = await createClient();

        const { error } = await auth.signOut();
        if (error) throw error;

        return { errorMessage: null };
    } catch (error) {
        // Handle error here
        console.log("Error logging out:", error);
        // return handleError(error);
    }
};

export const signUpAction = async (email: string, password: string) => {
    try {
        const { auth } = await createClient();

        const { data, error } = await auth.signUp({
            email,
            password,
        });
        if (error) throw error;

        const userId = data.user?.id;
        if (!userId) throw new Error("Error signing up");

        console.log("User ID:", userId);
        return { errorMessage: null };
    } catch (error) {
        // Handle error here
        console.log("Error signing up:", error);
        // return handleError(error);
    }
};