

export const getApiEndpoint = () => {
    const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
    if (url === undefined)
        throw new Error(
            "Please specify an API endpoint in the environment variable NEXT_PUBLIC_API_URL"
        );
    return url;
};