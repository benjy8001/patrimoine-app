<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Attachment extends Model
{
    protected $fillable = ['user_id', 'attachable_type', 'attachable_id', 'filename', 'original_name', 'mime_type', 'size', 'path', 'notes'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function attachable(): MorphTo { return $this->morphTo(); }
}
