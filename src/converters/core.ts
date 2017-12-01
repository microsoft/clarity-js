export default function(event: IEvent, dataConverter: (data: any) => any[]): IEventArray {
  let data: IEventArray = [
    event.type,
    event.id,
    event.time,
    dataConverter(event.data)
  ];
  return data;
}
