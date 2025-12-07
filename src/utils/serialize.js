export function serializeBigInts(obj) {
    try{
        if (Array.isArray(obj)) {
            return obj.map(serializeBigInts);
        } else if (obj && typeof obj === 'object') {
            return Object.fromEntries(
                Object.entries(obj).map(([key, value]) => [
                    key,
                    typeof value === 'bigint' ? value.toString() : serializeBigInts(value)
                ])
            );
        }
        return obj;
    }catch(err){
        console.error(err);
    }
}