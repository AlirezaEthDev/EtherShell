/**
 * Returns event values
 * @param {Object} contract 
 * @param {Object} tx 
 * @returns {Array<Object>}
 */

export function eventOf(contract, tx){
    const events = tx.logs.map(log => {
        try {
            return contract.interface.parseLog(log);
        } catch (e) {
        return null;
        }
    }).filter(log => log !== null);

    const parsedEvents = events.map(e => ({
        name: e.name,
        values: e.args,
    }));
    return parsedEvents;        
}